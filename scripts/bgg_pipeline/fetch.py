#!/usr/bin/env python3
"""
BGG Pipeline — Fetch game data via the official BGG XML API2.

Replaces the old 3-script scraping approach (01, 02, 03) with a single
script that:
  1. Discovers game IDs in each BGG sport family
  2. Fetches full game details in batches of 20
  3. Saves progress to a checkpoint file for crash recovery

Usage:
    # Full fetch (all 51 families)
    python fetch.py

    # Fetch specific families only
    python fetch.py --families 5840 5574

    # Resume from a crashed/interrupted run
    python fetch.py --resume

    # Dry run (discover IDs only, don't fetch details)
    python fetch.py --dry-run

    # Custom checkpoint path
    python fetch.py --checkpoint my_checkpoint.json
"""

import argparse
import json
import logging
import sys
import time
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path

import requests

from config import (
    ALL_FAMILY_IDS,
    BACKOFF_BASE,
    BACKOFF_MAX,
    BACKOFF_MAX_RETRIES,
    BATCH_SIZE_THING,
    BGG_API_BASE,
    FAMILY_ID_TO_SPORT,
    FAMILY_URL,
    QUEUED_MAX_POLLS,
    QUEUED_POLL_INTERVAL,
    REQUEST_DELAY,
    REQUEST_TIMEOUT,
    THING_URL,
)

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("bgg_fetch")

# ---------------------------------------------------------------------------
# Default checkpoint path (next to this script)
# ---------------------------------------------------------------------------
DEFAULT_CHECKPOINT = Path(__file__).parent / "bgg_checkpoint.json"


# ═══════════════════════════════════════════════════════════════════════════
# HTTP helpers
# ═══════════════════════════════════════════════════════════════════════════

def _get_with_backoff(url: str, params: dict | None = None) -> requests.Response:
    """
    GET with exponential backoff on 429/5xx and polling on 202 (queued).

    BGG XML API2 returns 202 when a request is queued for processing.
    We poll until we get the actual data (200) or give up.
    """
    for attempt in range(BACKOFF_MAX_RETRIES):
        try:
            resp = requests.get(url, params=params, timeout=REQUEST_TIMEOUT)
        except requests.RequestException as exc:
            wait = min(BACKOFF_BASE ** attempt, BACKOFF_MAX)
            log.warning("Request error (attempt %d): %s — retrying in %.0fs", attempt + 1, exc, wait)
            time.sleep(wait)
            continue

        if resp.status_code == 200:
            return resp

        # BGG queues the request — poll until ready
        if resp.status_code == 202:
            log.info("Request queued by BGG, polling...")
            for poll in range(QUEUED_MAX_POLLS):
                time.sleep(QUEUED_POLL_INTERVAL)
                try:
                    resp = requests.get(url, params=params, timeout=REQUEST_TIMEOUT)
                except requests.RequestException:
                    continue
                if resp.status_code == 200:
                    return resp
                if resp.status_code != 202:
                    break
            log.warning("Gave up polling after %d attempts", QUEUED_MAX_POLLS)
            # Fall through to backoff

        if resp.status_code == 429 or resp.status_code >= 500:
            wait = min(BACKOFF_BASE ** attempt, BACKOFF_MAX)
            log.warning("HTTP %d (attempt %d) — retrying in %.0fs", resp.status_code, attempt + 1, wait)
            time.sleep(wait)
            continue

        # Other errors — raise immediately
        resp.raise_for_status()

    raise RuntimeError(f"Gave up after {BACKOFF_MAX_RETRIES} attempts for {url}")


# ═══════════════════════════════════════════════════════════════════════════
# Phase 1: Discover game IDs from BGG families
# ═══════════════════════════════════════════════════════════════════════════

def discover_family_games(family_id: int) -> list[int]:
    """
    Fetch all boardgame IDs belonging to a BGG family.

    Uses: /xmlapi2/family?id=XXXX&type=boardgamefamily
    Returns: list of integer game IDs
    """
    params = {"id": family_id, "type": "boardgamefamily"}
    resp = _get_with_backoff(FAMILY_URL, params)
    root = ET.fromstring(resp.content)

    game_ids: list[int] = []
    for link in root.iter("link"):
        if link.get("type") == "boardgamefamily" and link.get("inbound") == "true":
            try:
                game_ids.append(int(link.get("id", "0")))
            except ValueError:
                continue

    return game_ids


def discover_all_families(family_ids: list[int]) -> dict[int, list[int]]:
    """
    Discover game IDs for each family. Returns {game_id: [family_ids]}.
    Deduplicates games appearing in multiple families.
    """
    game_to_families: dict[int, list[int]] = {}
    total = len(family_ids)

    for i, fam_id in enumerate(family_ids, 1):
        sport = FAMILY_ID_TO_SPORT.get(fam_id, f"Unknown({fam_id})")
        log.info("[%d/%d] Discovering family %d (%s)...", i, total, fam_id, sport)

        try:
            ids = discover_family_games(fam_id)
        except Exception as exc:
            log.error("Failed to discover family %d: %s", fam_id, exc)
            continue

        for gid in ids:
            if gid not in game_to_families:
                game_to_families[gid] = []
            if fam_id not in game_to_families[gid]:
                game_to_families[gid].append(fam_id)

        log.info("  Found %d games (total unique so far: %d)", len(ids), len(game_to_families))
        time.sleep(REQUEST_DELAY)

    return game_to_families


# ═══════════════════════════════════════════════════════════════════════════
# Phase 2: Fetch full game details via /xmlapi2/thing
# ═══════════════════════════════════════════════════════════════════════════

def _text(el: ET.Element | None) -> str | None:
    """Extract text content, or None."""
    if el is None:
        return None
    return el.text


def _attr_val(el: ET.Element | None, attr: str = "value") -> str | None:
    """Extract an attribute value, or None."""
    if el is None:
        return None
    return el.get(attr)


def _float_attr(el: ET.Element | None, attr: str = "value") -> float | None:
    """Extract a float attribute, or None."""
    raw = _attr_val(el, attr)
    if raw is None:
        return None
    try:
        v = float(raw)
        return v if v > 0 else None
    except (ValueError, TypeError):
        return None


def _int_attr(el: ET.Element | None, attr: str = "value") -> int | None:
    """Extract an integer attribute, or None."""
    raw = _attr_val(el, attr)
    if raw is None:
        return None
    try:
        v = int(raw)
        return v if v > 0 else None
    except (ValueError, TypeError):
        return None


def _collect_links(item: ET.Element, link_type: str) -> list[str]:
    """Collect all link values of a given type."""
    return [
        link.get("value", "")
        for link in item.findall("link")
        if link.get("type") == link_type and link.get("value")
    ]


def _parse_rank(rankings: ET.Element | None, rank_name: str) -> int | None:
    """Extract a rank value from the rankings element."""
    if rankings is None:
        return None
    for rank in rankings.findall("rank"):
        if rank.get("name") == rank_name:
            raw = rank.get("value")
            if raw and raw.lower() != "not ranked":
                try:
                    v = int(raw)
                    return v if 1 <= v <= 1_000_000 else None
                except (ValueError, TypeError):
                    pass
    return None


def _parse_player_poll(item: ET.Element) -> dict:
    """
    Parse the suggested_numplayers poll to find best and recommended
    player counts.
    """
    result = {
        "best_player_count_min": None,
        "best_player_count_max": None,
        "recommended_player_count_min": None,
        "recommended_player_count_max": None,
    }

    poll = None
    for p in item.findall("poll"):
        if p.get("name") == "suggested_numplayers":
            poll = p
            break
    if poll is None:
        return result

    best_counts: list[int] = []
    rec_counts: list[int] = []

    for results_el in poll.findall("results"):
        numplayers_str = results_el.get("numplayers", "")
        # Handle "4+" style values
        numplayers_str = numplayers_str.rstrip("+")
        try:
            numplayers = int(numplayers_str)
        except ValueError:
            continue

        votes = {"Best": 0, "Recommended": 0, "Not Recommended": 0}
        for r in results_el.findall("result"):
            name = r.get("value", "")
            try:
                votes[name] = int(r.get("numvotes", "0"))
            except ValueError:
                pass

        total = votes["Best"] + votes["Recommended"] + votes["Not Recommended"]
        if total == 0:
            continue

        if votes["Best"] > votes["Not Recommended"]:
            best_counts.append(numplayers)
        if votes["Best"] + votes["Recommended"] > votes["Not Recommended"]:
            rec_counts.append(numplayers)

    if best_counts:
        result["best_player_count_min"] = min(best_counts)
        result["best_player_count_max"] = max(best_counts)
    if rec_counts:
        result["recommended_player_count_min"] = min(rec_counts)
        result["recommended_player_count_max"] = max(rec_counts)

    return result


def parse_thing_item(item: ET.Element) -> dict:
    """Parse a single <item> element from /xmlapi2/thing response."""
    bgg_id = int(item.get("id", "0"))

    # Primary name
    name = None
    for n in item.findall("name"):
        if n.get("type") == "primary":
            name = n.get("value")
            break

    # Description (raw HTML — cleaned in import step)
    description = _text(item.find("description"))

    # Core fields
    year = _int_attr(item.find("yearpublished"))
    min_players = _int_attr(item.find("minplayers"))
    max_players = _int_attr(item.find("maxplayers"))
    playing_time = _int_attr(item.find("playingtime"))
    min_playtime = _int_attr(item.find("minplaytime"))
    max_playtime = _int_attr(item.find("maxplaytime"))
    min_age = _int_attr(item.find("minage"))

    # Images
    thumbnail_url = _text(item.find("thumbnail"))
    image_url = _text(item.find("image"))

    # Links (categories, mechanics, families, publishers, designers, etc.)
    categories = _collect_links(item, "boardgamecategory")
    mechanics = _collect_links(item, "boardgamemechanic")
    families = _collect_links(item, "boardgamefamily")
    designers = _collect_links(item, "boardgamedesigner")
    artists = _collect_links(item, "boardgameartist")
    publishers = _collect_links(item, "boardgamepublisher")
    subdomains = _collect_links(item, "boardgamesubdomain")

    # Reimplementations
    reimplementations: list[str] = []
    for link in item.findall("link"):
        if link.get("type") == "boardgameimplementation" and link.get("inbound"):
            val = link.get("value")
            if val:
                reimplementations.append(val)

    # Statistics
    stats = item.find("statistics")
    ratings = stats.find("ratings") if stats is not None else None

    average_rating = _float_attr(ratings.find("average") if ratings is not None else None)
    bayes_average = _float_attr(ratings.find("bayesaverage") if ratings is not None else None)
    users_rated = _int_attr(ratings.find("usersrated") if ratings is not None else None)
    num_owned = _int_attr(ratings.find("owned") if ratings is not None else None)
    wanting = _int_attr(ratings.find("wanting") if ratings is not None else None)
    wishing = _int_attr(ratings.find("wishing") if ratings is not None else None)
    num_comments = _int_attr(ratings.find("numcomments") if ratings is not None else None)
    num_weights = _int_attr(ratings.find("numweights") if ratings is not None else None)
    average_weight = _float_attr(ratings.find("averageweight") if ratings is not None else None)

    # Trading stats are in the ratings element
    trading = _int_attr(ratings.find("trading") if ratings is not None else None)

    # Ranks
    rankings = ratings.find("ranks") if ratings is not None else None
    overall_rank = _parse_rank(rankings, "boardgame")
    thematic_rank = _parse_rank(rankings, "thematic")
    strategy_rank = _parse_rank(rankings, "strategygames")

    # Player poll
    player_poll = _parse_player_poll(item)

    # Publisher info (first publisher only)
    publisher_name = publishers[0] if publishers else None

    return {
        "bgg_id": bgg_id,
        "name": name,
        "description": description,
        "year": year,
        "min_players": min_players,
        "max_players": max_players,
        "playing_time": playing_time,
        "min_playtime": min_playtime,
        "max_playtime": max_playtime,
        "min_age": min_age,
        "thumbnail_url": thumbnail_url,
        "image_url": image_url,
        "categories": categories,
        "mechanics": mechanics,
        "families_raw": families,
        "designers": designers,
        "artists": artists,
        "publishers": publishers,
        "subdomains": subdomains,
        "reimplementations": reimplementations,
        "publisher_name": publisher_name,
        "average_rating": average_rating,
        "bayes_average": bayes_average,
        "users_rated": users_rated,
        "num_owned": num_owned,
        "wanting": wanting,
        "wishing": wishing,
        "average_weight": average_weight,
        "overall_rank": overall_rank,
        "thematic_rank": thematic_rank,
        "strategy_rank": strategy_rank,
        **player_poll,
    }


def fetch_thing_batch(game_ids: list[int]) -> list[dict]:
    """
    Fetch details for a batch of up to 20 game IDs.
    Uses: /xmlapi2/thing?id=ID1,ID2,...&stats=1
    """
    ids_str = ",".join(str(gid) for gid in game_ids)
    params = {"id": ids_str, "stats": "1"}
    resp = _get_with_backoff(THING_URL, params)
    root = ET.fromstring(resp.content)

    results: list[dict] = []
    for item in root.findall("item"):
        if item.get("type") in ("boardgame", "boardgameexpansion"):
            try:
                results.append(parse_thing_item(item))
            except Exception as exc:
                log.error("Failed to parse item %s: %s", item.get("id"), exc)
    return results


# ═══════════════════════════════════════════════════════════════════════════
# Checkpoint management
# ═══════════════════════════════════════════════════════════════════════════

def load_checkpoint(path: Path) -> dict:
    """Load checkpoint from JSON, or return empty structure."""
    if path.exists():
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        log.info("Loaded checkpoint: %d games fetched, %d IDs pending",
                 len(data.get("games", {})), len(data.get("pending_ids", [])))
        return data
    return {
        "games": {},            # bgg_id (str) -> game data dict
        "game_families": {},    # bgg_id (str) -> [family_ids]
        "pending_ids": [],      # IDs still to fetch
        "fetched_ids": [],      # IDs already fetched
        "failed_ids": [],       # IDs that failed
        "metadata": {
            "started_at": datetime.now(timezone.utc).isoformat(),
            "families_discovered": [],
        },
    }


def save_checkpoint(data: dict, path: Path) -> None:
    """Save checkpoint to JSON."""
    data["metadata"]["last_saved"] = datetime.now(timezone.utc).isoformat()
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


# ═══════════════════════════════════════════════════════════════════════════
# Main pipeline
# ═══════════════════════════════════════════════════════════════════════════

def run_fetch(
    family_ids: list[int],
    checkpoint_path: Path,
    resume: bool = False,
    dry_run: bool = False,
    delay: float = REQUEST_DELAY,
) -> None:
    """
    Main fetch pipeline:
      1. Discover game IDs from families
      2. Fetch game details in batches of 20
      3. Save checkpoint after each batch
    """
    # Load or create checkpoint
    if resume and checkpoint_path.exists():
        cp = load_checkpoint(checkpoint_path)
    else:
        cp = load_checkpoint(Path("/nonexistent"))  # fresh start

    # ------------------------------------------------------------------
    # Phase 1: Discover game IDs from families
    # ------------------------------------------------------------------
    already_discovered = set(cp["metadata"].get("families_discovered", []))
    families_to_discover = [fid for fid in family_ids if fid not in already_discovered]

    if families_to_discover:
        log.info("=== Phase 1: Discovering game IDs from %d families ===", len(families_to_discover))
        game_to_families = discover_all_families(families_to_discover)

        # Merge into checkpoint
        for gid, fam_ids in game_to_families.items():
            gid_str = str(gid)
            if gid_str not in cp["game_families"]:
                cp["game_families"][gid_str] = fam_ids
            else:
                existing = cp["game_families"][gid_str]
                for fid in fam_ids:
                    if fid not in existing:
                        existing.append(fid)

        cp["metadata"]["families_discovered"] = list(
            already_discovered | set(families_to_discover)
        )

        # Build pending list (exclude already-fetched)
        fetched_set = set(cp.get("fetched_ids", []))
        all_game_ids = set(int(gid) for gid in cp["game_families"].keys())
        new_pending = sorted(all_game_ids - fetched_set)
        cp["pending_ids"] = new_pending

        save_checkpoint(cp, checkpoint_path)
        log.info("Discovery complete: %d unique game IDs (%d new to fetch)",
                 len(all_game_ids), len(new_pending))
    else:
        log.info("All families already discovered, skipping Phase 1")

    if dry_run:
        log.info("=== Dry run — skipping detail fetch ===")
        log.info("Would fetch %d games", len(cp["pending_ids"]))
        return

    # ------------------------------------------------------------------
    # Phase 2: Fetch game details in batches
    # ------------------------------------------------------------------
    pending = cp["pending_ids"]
    if not pending:
        log.info("No pending games to fetch!")
        return

    total = len(pending)
    log.info("=== Phase 2: Fetching details for %d games ===", total)

    fetched_count = 0
    failed_ids: list[int] = list(cp.get("failed_ids", []))

    for batch_start in range(0, total, BATCH_SIZE_THING):
        batch = pending[batch_start : batch_start + BATCH_SIZE_THING]
        batch_num = batch_start // BATCH_SIZE_THING + 1
        total_batches = (total + BATCH_SIZE_THING - 1) // BATCH_SIZE_THING

        log.info("[Batch %d/%d] Fetching %d games (IDs %d-%d)...",
                 batch_num, total_batches, len(batch), batch[0], batch[-1])

        try:
            results = fetch_thing_batch(batch)
        except Exception as exc:
            log.error("Batch failed: %s — marking %d IDs as failed", exc, len(batch))
            failed_ids.extend(batch)
            cp["failed_ids"] = failed_ids
            save_checkpoint(cp, checkpoint_path)
            time.sleep(delay)
            continue

        # Store results
        fetched_batch_ids: list[int] = []
        for game in results:
            gid_str = str(game["bgg_id"])
            cp["games"][gid_str] = game
            fetched_batch_ids.append(game["bgg_id"])
            fetched_count += 1

        # Track which IDs were fetched vs missing from response
        returned_ids = set(g["bgg_id"] for g in results)
        for gid in batch:
            if gid not in returned_ids:
                # BGG didn't return this ID — might be deleted/merged
                log.debug("BGG did not return game %d", gid)

        # Update checkpoint
        cp["fetched_ids"] = list(set(cp.get("fetched_ids", [])) | set(batch))
        cp["pending_ids"] = pending[batch_start + BATCH_SIZE_THING:]
        cp["failed_ids"] = failed_ids
        save_checkpoint(cp, checkpoint_path)

        log.info("  Got %d/%d games (total fetched: %d/%d)",
                 len(results), len(batch), fetched_count, total)
        time.sleep(delay)

    # ------------------------------------------------------------------
    # Summary
    # ------------------------------------------------------------------
    log.info("=" * 60)
    log.info("Fetch complete!")
    log.info("  Total games in checkpoint: %d", len(cp["games"]))
    log.info("  Fetched this run: %d", fetched_count)
    log.info("  Failed IDs: %d", len(failed_ids))
    log.info("  Checkpoint saved to: %s", checkpoint_path)

    if failed_ids:
        log.warning("Failed IDs: %s", failed_ids[:20])
        if len(failed_ids) > 20:
            log.warning("  ... and %d more", len(failed_ids) - 20)


# ═══════════════════════════════════════════════════════════════════════════
# CLI
# ═══════════════════════════════════════════════════════════════════════════

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Fetch BGG game data via XML API2 with checkpointing",
    )
    parser.add_argument(
        "--families",
        type=int,
        nargs="*",
        default=None,
        help="Specific family IDs to fetch (default: all 51)",
    )
    parser.add_argument(
        "--resume",
        action="store_true",
        help="Resume from existing checkpoint",
    )
    parser.add_argument(
        "--checkpoint",
        type=Path,
        default=DEFAULT_CHECKPOINT,
        help=f"Checkpoint file path (default: {DEFAULT_CHECKPOINT})",
    )
    parser.add_argument(
        "--delay",
        type=float,
        default=REQUEST_DELAY,
        help=f"Delay between requests in seconds (default: {REQUEST_DELAY})",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Discover IDs only, don't fetch details",
    )
    parser.add_argument(
        "-v", "--verbose",
        action="store_true",
        help="Enable debug logging",
    )

    args = parser.parse_args()

    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)

    family_ids = args.families if args.families else ALL_FAMILY_IDS

    # Validate family IDs
    for fid in family_ids:
        if fid not in FAMILY_ID_TO_SPORT:
            log.warning("Family ID %d not in config — will be fetched but sport name unknown", fid)

    log.info("BGG Fetch Pipeline")
    log.info("  Families: %d", len(family_ids))
    log.info("  Checkpoint: %s", args.checkpoint)
    log.info("  Resume: %s", args.resume)
    log.info("  Delay: %.1fs", args.delay)
    log.info("  Dry run: %s", args.dry_run)

    run_fetch(
        family_ids=family_ids,
        checkpoint_path=args.checkpoint,
        resume=args.resume,
        dry_run=args.dry_run,
        delay=args.delay,
    )


if __name__ == "__main__":
    main()
