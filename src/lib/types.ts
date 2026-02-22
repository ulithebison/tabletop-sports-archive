// ================================================================
// Tabletop Sports Games Archive — TypeScript Types
// ================================================================

export interface Game {
  id: number;
  source: "bgg" | "manual";
  bgg_id: number | null;
  name: string;
  subtitle: string | null;
  sport: string | null;
  sport_id: number | null;
  year: number | null;
  type: string | null;
  description: string | null;
  players: string | null;
  playtime: string | null;
  complexity: "Simple" | "Medium" | "Complex" | "Expert" | null;
  min_age: number | null;
  bgg_url: string | null;
  publisher_name: string | null;
  publisher_website_title: string | null;
  publisher_website: string | null;
  image_page_href: string | null;
  image_url: string | null;
  thumbnail_url: string | null;
  top_image_url: string | null;
  image_1_url: string | null;
  image_2_url: string | null;
  image_3_url: string | null;
  logo_url: string | null;
  video_url: string | null;
  download_1_name: string | null;
  download_1_url: string | null;
  download_2_name: string | null;
  download_2_url: string | null;
  download_3_name: string | null;
  download_3_url: string | null;
  average_rating: number | null;
  bayes_average: number | null;
  users_rated: number | null;
  num_owned: number | null;
  wanting: number | null;
  wishing: number | null;
  plays: number | null;
  overall_rank: number | null;
  thematic_rank: number | null;
  strategy_rank: number | null;
  best_player_count_min: number | null;
  best_player_count_max: number | null;
  recommended_player_count_min: number | null;
  recommended_player_count_max: number | null;
  categories: string | null;
  mechanics: string | null;
  families: string | null;
  subdomains: string | null;
  artists: string | null;
  authors: string | null;
  developers: string | null;
  graphic_designers: string | null;
  sculptors: string | null;
  editors: string | null;
  writers: string | null;
  reimplementations: string | null;
  verification_status: string | null;
  in_out_of_print: string | null;
  review: string | null;
  series_name: string | null;
  format: string | null;
  version: string | null;
  scraped_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined from game_views
  view_count?: number;
  // Joined from community ratings aggregate
  community_avg?: number | null;
  community_count?: number | null;
}

export interface GameView {
  game_id: number;
  view_count: number;
}

export interface Rating {
  id: number;
  game_id: number;
  session_id: string;
  stars: number; // 1–5
  created_at: string;
}

export interface Review {
  id: number;
  game_id: number;
  author: string;
  email: string | null;
  body: string;
  stars: number | null; // 1–5
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

export interface GameSubmission {
  id: number;
  name: string;
  subtitle: string | null;
  sport: string | null;
  year: number | null;
  type: string | null;
  description: string | null;
  players: string | null;
  playtime: string | null;
  complexity: string | null;
  publisher_name: string | null;
  publisher_website: string | null;
  bgg_url: string | null;
  image_url: string | null;
  submitter_name: string | null;
  submitter_email: string | null;
  approved_game_id: number | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

export interface Comment {
  id: number;
  game_id: number;
  author: string;
  body: string;
  created_at: string;
}

export interface NewsItem {
  id: number;
  title: string;
  body: string;
  created_at: string;
}

export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  body: string;
  excerpt: string | null;
  image_url: string | null;
  status: "draft" | "published";
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

// Filter params for game list
export interface GameFilters {
  sport?: string;       // comma-separated for multi-select
  type?: string;        // comma-separated for multi-select
  designer?: string;    // exact designer name (matches within semicolon-separated authors)
  yearMin?: number;
  yearMax?: number;
  complexity?: string;
  source?: string;
  search?: string;
  sort?: "name" | "year_desc" | "views";
  page?: number;
  players?: string;
  playtimeRange?: string; // "quick" | "short" | "medium" | "long"
}

// Pagination result wrapper
export interface PaginatedResult<T> {
  data: T[];
  count: number;
  page: number;
  perPage: number;
  totalPages: number;
}
