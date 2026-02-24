#!/usr/bin/env python3
"""
BGG Pipeline — Transform checkpoint data and import into Supabase.

Replaces the old 3-script approach (04, 05, 06) with a single script that:
  1. Reads the checkpoint JSON from fetch.py
  2. Applies all transformations (sport labels, type, complexity, formatting)
  3. Upserts games into Supabase (insert new, optionally update existing)

Usage:
    # Dry run — transform and validate without touching DB
    python import_to_db.py --dry-run

    # Import new games only (skip existing bgg_ids)
    python import_to_db.py

    # Force update all games (including existing)
    python import_to_db.py --force-update

    # Export transformed data to JSON for inspection
    python import_to_db.py --export-json transformed.json

    # Custom checkpoint path
    python import_to_db.py --checkpoint my_checkpoint.json
"""

import argparse
import html
import json
import logging
import os
import re
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv

from config import (
    FAMILY_ID_TO_SPORT,
    SUPABASE_COLUMNS,
    derive_game_type,
    is_valid_url,
    publisher_website_fallback,
    weight_to_complexity,
)

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("bgg_import")

# ---------------------------------------------------------------------------
# Default checkpoint path
# ---------------------------------------------------------------------------
DEFAULT_CHECKPOINT = Path(__file__).parent / "bgg_checkpoint.json"

# ---------------------------------------------------------------------------
# Load environment variables
# ---------------------------------------------------------------------------
# Look for .env in project root, then script directory
for env_path in [
    Path(__file__).resolve().parents[2] / ".env.local",
    Path(__file__).resolve().parents[2] / ".env",
    Path(__file__).parent / ".env",
]:
    if env_path.exists():
        load_dotenv(env_path)
        log.info("Loaded env from %s", env_path)
        break


# ═══════════════════════════════════════════════════════════════════════════
# HTML / text cleaning
# ═══════════════════════════════════════════════════════════════════════════

def clean_html(raw: str | None) -> str | None:
    """Strip HTML tags, decode entities, normalize whitespace."""
    if not raw:
        return None
    # Decode HTML entities
    text = html.unescape(raw)
    # Remove HTML tags
    text = re.sub(r"<[^>]+>", " ", text)
    # Normalize whitespace
    text = re.sub(r"\s+", " ", text).strip()
    return text if text else None


def clean_value(val: str | None) -> str | None:
    """Convert sentinel strings to None."""
    if val is None:
        return None
    if str(val).strip().lower() in ("false", "null", "none", "n/a", "na", "0", ""):
        return None
    return str(val).strip()


# ═══════════════════════════════════════════════════════════════════════════
# Transformation logic
# ═══════════════════════════════════════════════════════════════════════════

def format_players(min_p: int | None, max_p: int | None) -> str | None:
    """Format player count as string (e.g. '2-4' or '2')."""
    if min_p is None and max_p is None:
        return None
    if min_p is not None and max_p is not None:
        if min_p == max_p:
            return str(min_p)
        return f"{min_p}-{max_p}"
    return str(min_p or max_p)


def format_playtime(playing_time: int | None, min_time: int | None, max_time: int | None) -> str | None:
    """Format playtime as string (e.g. '30-60 min' or '30 min')."""
    lo = min_time or playing_time
    hi = max_time or playing_time

    if lo is None and hi is None:
        return None
    if lo is not None and hi is not None and lo != hi:
        return f"{lo}-{hi} min"
    val = lo or hi
    return f"{val} min" if val else None


def join_list(items: list[str] | None) -> str | None:
    """Join a list with '; ' separator."""
    if not items:
        return None
    joined = "; ".join(items)
    return joined if joined else None


def transform_game(raw: dict, family_ids: list[int]) -> dict:
    """
    Transform a raw game dict (from fetch.py checkpoint) into a
    Supabase-ready row matching the games table schema.
    """
    bgg_id = raw["bgg_id"]

    # Sport labels (from family mapping, sorted, deduplicated)
    sport_names: list[str] = []
    sport_id_parts: list[str] = []
    for fid in sorted(family_ids):
        sport = FAMILY_ID_TO_SPORT.get(fid)
        if sport and sport not in sport_names:
            sport_names.append(sport)
            sport_id_parts.append(str(fid))

    sport = "; ".join(sport_names) if sport_names else None
    # sport_id: integer if single, semicolon-separated string if multiple
    if len(sport_id_parts) == 1:
        sport_id = int(sport_id_parts[0])
    elif sport_id_parts:
        sport_id = "; ".join(sport_id_parts)
    else:
        sport_id = None

    # Type derivation
    categories = raw.get("categories") or []
    mechanics = raw.get("mechanics") or []
    game_type = derive_game_type(categories, mechanics)

    # Complexity
    complexity = weight_to_complexity(raw.get("average_weight"))

    # Players and playtime
    players = format_players(raw.get("min_players"), raw.get("max_players"))
    playtime = format_playtime(
        raw.get("playing_time"),
        raw.get("min_playtime"),
        raw.get("max_playtime"),
    )

    # Description (clean HTML)
    description = clean_html(raw.get("description"))

    # Publisher website
    publisher_name = raw.get("publisher_name")
    # Try to find a publisher website from BGG (not available via XML API2,
    # so we use the Google Search fallback)
    pub_website = None
    pub_website_title = None
    if publisher_name and raw.get("name"):
        pub_website, pub_website_title = publisher_website_fallback(raw["name"])
    elif raw.get("name"):
        pub_website, pub_website_title = publisher_website_fallback(raw["name"])

    # BGG URL
    bgg_url = f"https://boardgamegeek.com/boardgame/{bgg_id}" if bgg_id else None

    # Ratings and ranks — validate ranges
    average_rating = raw.get("average_rating")
    if average_rating is not None and not (0 <= average_rating <= 10):
        average_rating = None

    bayes_average = raw.get("bayes_average")
    if bayes_average is not None and not (0 <= bayes_average <= 10):
        bayes_average = None

    year = raw.get("year")
    if year is not None and not (1800 <= year <= 2100):
        year = None

    row = {
        "bgg_id": bgg_id,
        "name": raw.get("name"),
        "subtitle": None,
        "sport": sport,
        "sport_id": sport_id,
        "year": year,
        "type": game_type,
        "description": description,
        "players": players,
        "playtime": playtime,
        "complexity": complexity,
        "min_age": raw.get("min_age"),
        "bgg_url": bgg_url,
        "publisher_name": publisher_name,
        "publisher_website_title": pub_website_title,
        "publisher_website": pub_website,
        "image_page_href": None,
        "image_url": raw.get("image_url"),
        "thumbnail_url": raw.get("thumbnail_url"),
        "top_image_url": None,
        "average_rating": average_rating,
        "bayes_average": bayes_average,
        "users_rated": raw.get("users_rated"),
        "num_owned": raw.get("num_owned"),
        "wanting": raw.get("wanting"),
        "wishing": raw.get("wishing"),
        "plays": None,  # Not available via XML API2 stats endpoint
        "overall_rank": raw.get("overall_rank"),
        "thematic_rank": raw.get("thematic_rank"),
        "strategy_rank": raw.get("strategy_rank"),
        "best_player_count_min": raw.get("best_player_count_min"),
        "best_player_count_max": raw.get("best_player_count_max"),
        "recommended_player_count_min": raw.get("recommended_player_count_min"),
        "recommended_player_count_max": raw.get("recommended_player_count_max"),
        "categories": join_list(categories),
        "mechanics": join_list(mechanics),
        "families": join_list(raw.get("families_raw")),
        "subdomains": join_list(raw.get("subdomains")),
        "artists": join_list(raw.get("artists")),
        "authors": join_list(raw.get("designers")),
        "developers": None,
        "graphic_designers": None,
        "sculptors": None,
        "editors": None,
        "writers": None,
        "reimplementations": join_list(raw.get("reimplementations")),
        "source": "bgg",
        "scraped_at": datetime.now(timezone.utc).isoformat(),
    }

    return row


# ═══════════════════════════════════════════════════════════════════════════
# Supabase helpers
# ═══════════════════════════════════════════════════════════════════════════

def get_supabase_client():
    """Create and return a Supabase client using environment variables."""
    from supabase import create_client

    url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY") or os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

    if not url or not key:
        log.error("Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or SUPABASE_SERVICE_ROLE_KEY)")
        sys.exit(1)

    return create_client(url, key)


def fetch_existing_bgg_ids(supabase) -> set[int]:
    """Fetch all existing bgg_ids from the games table (paginated)."""
    existing: set[int] = set()
    page_size = 1000
    offset = 0

    while True:
        resp = (
            supabase.table("games")
            .select("bgg_id")
            .not_.is_("bgg_id", "null")
            .range(offset, offset + page_size - 1)
            .execute()
        )
        rows = resp.data or []
        for row in rows:
            if row.get("bgg_id") is not None:
                existing.add(int(row["bgg_id"]))
        if len(rows) < page_size:
            break
        offset += page_size

    return existing


def batch_upsert(supabase, rows: list[dict], batch_size: int = 50) -> tuple[int, int]:
    """
    Upsert rows into Supabase games table in batches.
    Returns (success_count, failure_count).
    """
    success = 0
    failure = 0

    for i in range(0, len(rows), batch_size):
        batch = rows[i : i + batch_size]
        try:
            supabase.table("games").upsert(
                batch, on_conflict="bgg_id"
            ).execute()
            success += len(batch)
            log.info("  Upserted batch %d-%d (%d games)",
                     i + 1, i + len(batch), len(batch))
        except Exception as exc:
            log.warning("Batch upsert failed: %s — falling back to individual inserts", exc)
            for row in batch:
                try:
                    supabase.table("games").upsert(
                        row, on_conflict="bgg_id"
                    ).execute()
                    success += 1
                except Exception as exc2:
                    log.error("Failed to upsert game %s (bgg_id=%s): %s",
                              row.get("name", "?"), row.get("bgg_id", "?"), exc2)
                    failure += 1

    return success, failure


# ═══════════════════════════════════════════════════════════════════════════
# Main pipeline
# ═══════════════════════════════════════════════════════════════════════════

def run_import(
    checkpoint_path: Path,
    dry_run: bool = False,
    force_update: bool = False,
    batch_size: int = 50,
    export_json: Path | None = None,
) -> None:
    """
    Main import pipeline:
      1. Load checkpoint
      2. Transform all games
      3. Filter to new-only (or all if --force-update)
      4. Upsert to Supabase
    """
    # ------------------------------------------------------------------
    # Load checkpoint
    # ------------------------------------------------------------------
    if not checkpoint_path.exists():
        log.error("Checkpoint file not found: %s", checkpoint_path)
        log.error("Run fetch.py first to create the checkpoint.")
        sys.exit(1)

    with open(checkpoint_path, "r", encoding="utf-8") as f:
        cp = json.load(f)

    games_raw = cp.get("games", {})
    game_families = cp.get("game_families", {})

    log.info("Loaded checkpoint: %d games", len(games_raw))

    # ------------------------------------------------------------------
    # Transform all games
    # ------------------------------------------------------------------
    log.info("=== Transforming games ===")
    transformed: list[dict] = []
    skipped = 0

    for gid_str, raw in games_raw.items():
        fam_ids = game_families.get(gid_str, [])
        if not fam_ids:
            # Game has no family mapping — skip
            skipped += 1
            continue

        try:
            row = transform_game(raw, fam_ids)
            if row.get("name"):
                transformed.append(row)
            else:
                skipped += 1
                log.debug("Skipped game %s (no name)", gid_str)
        except Exception as exc:
            log.error("Failed to transform game %s: %s", gid_str, exc)
            skipped += 1

    log.info("Transformed %d games (%d skipped)", len(transformed), skipped)

    # ------------------------------------------------------------------
    # Transformation summary
    # ------------------------------------------------------------------
    sports_count: dict[str, int] = {}
    types_count: dict[str, int] = {}
    complexity_count: dict[str, int] = {}

    for row in transformed:
        # Sports
        for s in (row.get("sport") or "").split("; "):
            s = s.strip()
            if s:
                sports_count[s] = sports_count.get(s, 0) + 1
        # Types
        t = row.get("type", "Unknown")
        types_count[t] = types_count.get(t, 0) + 1
        # Complexity
        c = row.get("complexity") or "None"
        complexity_count[c] = complexity_count.get(c, 0) + 1

    log.info("--- Sport distribution ---")
    for s in sorted(sports_count.keys()):
        log.info("  %-35s %d", s, sports_count[s])

    log.info("--- Type distribution ---")
    for t in sorted(types_count.keys()):
        log.info("  %-20s %d", t, types_count[t])

    log.info("--- Complexity distribution ---")
    for c in ["Simple", "Medium", "Complex", "Expert", "None"]:
        if c in complexity_count:
            log.info("  %-20s %d", c, complexity_count[c])

    # ------------------------------------------------------------------
    # Export JSON if requested
    # ------------------------------------------------------------------
    if export_json:
        with open(export_json, "w", encoding="utf-8") as f:
            json.dump(transformed, f, ensure_ascii=False, indent=2)
        log.info("Exported %d transformed games to %s", len(transformed), export_json)

    # ------------------------------------------------------------------
    # Dry run stops here
    # ------------------------------------------------------------------
    if dry_run:
        log.info("=== Dry run complete — no database changes ===")
        return

    # ------------------------------------------------------------------
    # Connect to Supabase
    # ------------------------------------------------------------------
    log.info("=== Connecting to Supabase ===")
    supabase = get_supabase_client()

    # ------------------------------------------------------------------
    # Filter: new games only (unless --force-update)
    # ------------------------------------------------------------------
    if force_update:
        to_upsert = transformed
        log.info("Force update: upserting all %d games", len(to_upsert))
    else:
        log.info("Fetching existing bgg_ids from Supabase...")
        existing_ids = fetch_existing_bgg_ids(supabase)
        log.info("Found %d existing games in database", len(existing_ids))

        to_upsert = [
            row for row in transformed
            if row.get("bgg_id") not in existing_ids
        ]
        log.info("New games to insert: %d (skipping %d existing)",
                 len(to_upsert), len(transformed) - len(to_upsert))

    if not to_upsert:
        log.info("Nothing to import!")
        return

    # ------------------------------------------------------------------
    # Upsert to Supabase
    # ------------------------------------------------------------------
    log.info("=== Importing %d games to Supabase ===", len(to_upsert))
    success, failure = batch_upsert(supabase, to_upsert, batch_size)

    # ------------------------------------------------------------------
    # Summary
    # ------------------------------------------------------------------
    log.info("=" * 60)
    log.info("Import complete!")
    log.info("  Total transformed: %d", len(transformed))
    log.info("  Attempted upsert:  %d", len(to_upsert))
    log.info("  Succeeded:         %d", success)
    log.info("  Failed:            %d", failure)


# ═══════════════════════════════════════════════════════════════════════════
# CLI
# ═══════════════════════════════════════════════════════════════════════════

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Transform BGG checkpoint data and import into Supabase",
    )
    parser.add_argument(
        "--checkpoint",
        type=Path,
        default=DEFAULT_CHECKPOINT,
        help=f"Checkpoint file path (default: {DEFAULT_CHECKPOINT})",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Transform and validate only, don't touch the database",
    )
    parser.add_argument(
        "--force-update",
        action="store_true",
        help="Update existing games (not just insert new ones)",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=50,
        help="Batch size for Supabase upserts (default: 50)",
    )
    parser.add_argument(
        "--export-json",
        type=Path,
        default=None,
        help="Export transformed data to JSON file",
    )
    parser.add_argument(
        "-v", "--verbose",
        action="store_true",
        help="Enable debug logging",
    )

    args = parser.parse_args()

    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)

    log.info("BGG Import Pipeline")
    log.info("  Checkpoint: %s", args.checkpoint)
    log.info("  Dry run: %s", args.dry_run)
    log.info("  Force update: %s", args.force_update)
    log.info("  Batch size: %d", args.batch_size)

    run_import(
        checkpoint_path=args.checkpoint,
        dry_run=args.dry_run,
        force_update=args.force_update,
        batch_size=args.batch_size,
        export_json=args.export_json,
    )


if __name__ == "__main__":
    main()
