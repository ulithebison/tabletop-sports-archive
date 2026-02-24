"""
BGG Pipeline — Shared configuration.

Single source of truth for family→sport mappings, column schema,
complexity derivation, type detection, and rate-limit constants.
"""

# ---------------------------------------------------------------------------
# BGG Family ID → Sport Name  (51 families, from Script 03 authoritative list)
# ---------------------------------------------------------------------------
FAMILY_ID_TO_SPORT: dict[int, str] = {
    6973:   "Aerial Racing",
    5640:   "American Football",
    5712:   "Athletics / Track and Field",
    5820:   "Australian Football",
    6206:   "Auto Racing",
    18684:  "Badminton",
    5586:   "Baseball",
    5574:   "Basketball",
    37345:  "Biathlon",
    5663:   "Bicycling / Cycling",
    6949:   "Billiards / Snooker / Pool",
    5700:   "Bowling",
    5839:   "Boxing",
    68958:  "Chariot Racing",
    5786:   "Combat Sports / Martial Arts",
    5706:   "Cricket",
    5840:   "Curling",
    110437: "Dancing",
    79834:  "Dog Sledding",
    71035:  "Equestrian",
    71169:  "Fencing",
    71018:  "Field Hockey",
    5551:   "Soccer / Football",
    72934:  "Formula 1",
    66520:  "Gaelic Football",
    68890:  "Giro d'Italia",
    5652:   "Golf",
    5832:   "Greyhound Racing",
    5730:   "Horse Racing",
    6096:   "Hunting",
    112585: "Hydroplane Racing",
    5628:   "Ice Hockey",
    112586: "Kung Fu",
    68889:  "La Vuelta a Espana",
    20717:  "Motorcycle Racing",
    6043:   "Mountain Climbing",
    5837:   "Olympics",
    67047:  "Paintball",
    112371: "Petanque",
    26841:  "Roller Derby",
    70466:  "Rowing",
    5573:   "Rugby",
    5831:   "Sailing",
    6496:   "Skateboarding",
    68282:  "Skiing",
    6497:   "Surfing",
    5626:   "Tennis",
    66168:  "Tour de France",
    19284:  "Volleyball",
    5732:   "Winter Sports",
    5664:   "Wrestling",
}

ALL_FAMILY_IDS: list[int] = sorted(FAMILY_ID_TO_SPORT.keys())

# ---------------------------------------------------------------------------
# Rate-limit / request constants
# ---------------------------------------------------------------------------
REQUEST_DELAY: float = 0.6          # seconds between API calls
BACKOFF_BASE: float = 2.0           # exponential backoff base
BACKOFF_MAX: float = 120.0          # max backoff ceiling in seconds
BACKOFF_MAX_RETRIES: int = 8        # give up after this many retries
REQUEST_TIMEOUT: int = 30           # HTTP timeout in seconds
BATCH_SIZE_THING: int = 20          # max IDs per /xmlapi2/thing request
QUEUED_POLL_INTERVAL: float = 5.0   # seconds between polls for 202 responses
QUEUED_MAX_POLLS: int = 12          # max polls before giving up on a 202

# ---------------------------------------------------------------------------
# BGG XML API2 endpoints
# ---------------------------------------------------------------------------
BGG_API_BASE = "https://boardgamegeek.com/xmlapi2"
FAMILY_URL = f"{BGG_API_BASE}/family"      # ?id=XXXX&type=boardgamefamily
THING_URL = f"{BGG_API_BASE}/thing"        # ?id=ID1,ID2,...&stats=1

# ---------------------------------------------------------------------------
# Complexity mapping  (BGG average weight → complexity label)
# ---------------------------------------------------------------------------
def weight_to_complexity(weight: float | None) -> str | None:
    """Map BGG average weight (1-5 scale) to complexity label."""
    if weight is None or weight <= 0:
        return None
    if weight < 2.0:
        return "Simple"
    if weight < 3.0:
        return "Medium"
    if weight < 4.0:
        return "Complex"
    return "Expert"


# ---------------------------------------------------------------------------
# Type derivation  (Card / Dice / Card and Dice / Tabletop)
# ---------------------------------------------------------------------------
def derive_game_type(categories: list[str], mechanics: list[str]) -> str:
    """Derive game type from BGG categories and mechanics lists."""
    cats_lower = " | ".join(c.lower() for c in categories)
    mechs_lower = " | ".join(m.lower() for m in mechanics)

    has_card = (
        "card game" in cats_lower
        or "card drafting" in mechs_lower
        or "hand management" in mechs_lower
    )
    has_dice = (
        "dice" in cats_lower
        or "dice rolling" in mechs_lower
    )

    if has_card and has_dice:
        return "Card and Dice"
    if has_card:
        return "Card"
    if has_dice:
        return "Dice"
    return "Tabletop"


# ---------------------------------------------------------------------------
# Publisher website fallback
# ---------------------------------------------------------------------------
def publisher_website_fallback(game_name: str) -> tuple[str, str]:
    """Return (url, title) Google Search fallback for a game."""
    from urllib.parse import quote_plus
    query = quote_plus(f"{game_name} tabletop sports game")
    url = f"https://www.google.com/search?q={query}"
    return url, "Search on Google"


def is_valid_url(url: str | None) -> bool:
    """Check if a URL is a real http(s) URL (not a placeholder)."""
    if not url:
        return False
    url_lower = url.strip().lower()
    if url_lower in ("false", "null", "none", "n/a", "na", "0", ""):
        return False
    return url_lower.startswith("http://") or url_lower.startswith("https://")


# ---------------------------------------------------------------------------
# Supabase column list  (matches src/lib/types.ts Game interface)
# ---------------------------------------------------------------------------
SUPABASE_COLUMNS: list[str] = [
    "bgg_id",
    "name",
    "subtitle",
    "sport",
    "sport_id",
    "year",
    "type",
    "description",
    "players",
    "playtime",
    "complexity",
    "min_age",
    "bgg_url",
    "publisher_name",
    "publisher_website_title",
    "publisher_website",
    "image_page_href",
    "image_url",
    "thumbnail_url",
    "top_image_url",
    "average_rating",
    "bayes_average",
    "users_rated",
    "num_owned",
    "wanting",          # was num_wanting in old pipeline
    "wishing",          # was num_wishing in old pipeline
    "plays",            # was num_plays in old pipeline
    "overall_rank",
    "thematic_rank",
    "strategy_rank",
    "best_player_count_min",
    "best_player_count_max",
    "recommended_player_count_min",
    "recommended_player_count_max",
    "categories",
    "mechanics",
    "families",
    "subdomains",
    "artists",
    "authors",
    "developers",
    "graphic_designers",
    "sculptors",
    "editors",
    "writers",
    "reimplementations",
    "source",
    "scraped_at",
]
