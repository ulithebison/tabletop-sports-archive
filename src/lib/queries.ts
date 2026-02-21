import { createClient } from "./supabase/server";
import type { Game, GameFilters, PaginatedResult, Review, GameSubmission, NewsItem, Comment } from "./types";

const PER_PAGE = 48;

// ================================================================
// GAME QUERIES
// ================================================================

const PLAYTIME_PATTERNS: Record<string, string> = {
  quick:  "^([1-9]|[12][0-9])([ -])",                                   // first num 1–29
  short:  "^([3-5][0-9])([ -])",                                        // first num 30–59
  medium: "^([6-9][0-9]|1[01][0-9])([ -])",                             // first num 60–119
  long:   "^(1[2-9][0-9]|[2-9][0-9]{2}|[0-9]{4,})([ -])",              // first num ≥ 120
};

export async function getGames(filters: GameFilters = {}): Promise<PaginatedResult<Game>> {
  const supabase = await createClient();
  const page = filters.page ?? 1;
  const offset = (page - 1) * PER_PAGE;

  let query = supabase.from("games_with_views").select("*", { count: "exact" });

  // Apply filters
  if (filters.sport) {
    const sportList = filters.sport.split(",").map((s) => s.trim()).filter(Boolean);
    const orParts = sportList.flatMap((s) => [
      `sport.eq.${s}`,
      `sport.ilike.${s};%`,
      `sport.ilike.%; ${s}`,
      `sport.ilike.%; ${s};%`,
    ]);
    query = query.or(orParts.join(","));
  }
  if (filters.type) {
    const typeList = filters.type.split(",").map((t) => t.trim()).filter(Boolean);
    const orParts = typeList.flatMap((t) => [
      `type.eq.${t}`,
      `type.ilike.${t};%`,
      `type.ilike.%; ${t}`,
      `type.ilike.%; ${t};%`,
    ]);
    query = query.or(orParts.join(","));
  }
  if (filters.complexity) query = query.eq("complexity", filters.complexity);
  if (filters.source) query = query.eq("source", filters.source);
  if (filters.yearMin) query = query.gte("year", filters.yearMin);
  if (filters.yearMax) query = query.lte("year", filters.yearMax);
  if (filters.search) query = query.ilike("name", `%${filters.search}%`);
  if (filters.players) {
    switch (filters.players) {
      case "solo":
        query = query.lte("recommended_player_count_min", 1).gte("recommended_player_count_max", 1);
        break;
      case "2":
        query = query.lte("recommended_player_count_min", 2).gte("recommended_player_count_max", 2);
        break;
      case "3-4":
        query = query.lte("recommended_player_count_min", 4).gte("recommended_player_count_max", 3);
        break;
      case "5+":
        query = query.gte("recommended_player_count_max", 5);
        break;
    }
  }
  if (filters.designer) {
    const d = filters.designer;
    query = query.or(`authors.eq.${d},authors.ilike.${d};%,authors.ilike.%; ${d},authors.ilike.%; ${d};%`);
  }
  if (filters.playtimeRange) {
    const pattern = PLAYTIME_PATTERNS[filters.playtimeRange];
    if (pattern) query = query.filter("playtime", "match", pattern);
  }

  // Sorting
  switch (filters.sort) {
    case "year_desc":
      query = query.order("year", { ascending: false, nullsFirst: false });
      break;
    case "views":
      query = query.order("total_views", { ascending: false });
      break;
    default:
      query = query.order("name", { ascending: true });
  }

  // Pagination
  query = query.range(offset, offset + PER_PAGE - 1);

  const { data, error, count } = await query;

  if (error) throw error;

  // Map total_views from the view into view_count field
  const items = ((data ?? []) as Record<string, unknown>[]).map((row) => {
    const { total_views, community_avg, community_count, ...rest } = row;
    return {
      ...rest,
      view_count: (total_views as number) ?? 0,
      community_avg: (community_avg as number) ?? null,
      community_count: (community_count as number) ?? null,
    } as Game;
  });

  return {
    data: items,
    count: count ?? 0,
    page,
    perPage: PER_PAGE,
    totalPages: Math.ceil((count ?? 0) / PER_PAGE),
  };
}

export async function getGame(id: number): Promise<Game | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("games")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data as Game;
}

export async function getRelatedGames(sport: string, excludeId: number): Promise<Game[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("games")
    .select("id, name, sport, type, year, thumbnail_url, average_rating")
    .or(`sport.eq.${sport},sport.ilike.${sport};%,sport.ilike.%; ${sport},sport.ilike.%; ${sport};%`)
    .neq("id", excludeId)
    .limit(6);

  return (data ?? []) as Game[];
}

export async function getGameCount(): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("games")
    .select("*", { count: "exact", head: true });
  return count ?? 0;
}

// ================================================================
// SPORTS & TYPES (for filter dropdowns)
// ================================================================

/** Fetch ALL rows for a single column, paginating in batches of 1000 to bypass Supabase's default row limit. */
async function fetchAllColumn<T extends Record<string, unknown>>(
  table: string,
  column: string
): Promise<T[]> {
  const supabase = await createClient();
  const BATCH = 1000;
  const rows: T[] = [];
  let offset = 0;

  while (true) {
    const { data } = await supabase
      .from(table)
      .select(column)
      .not(column, "is", null)
      .range(offset, offset + BATCH - 1);

    if (!data || data.length === 0) break;
    rows.push(...(data as unknown as T[]));
    if (data.length < BATCH) break; // last page
    offset += BATCH;
  }

  return rows;
}

export async function getSports(): Promise<{ sport: string; count: number }[]> {
  const data = await fetchAllColumn<{ sport: string }>("games", "sport");

  if (data.length === 0) return [];

  // Count occurrences client-side, splitting semicolon-separated sport values
  const counts: Record<string, number> = {};
  for (const row of data) {
    if (row.sport) {
      for (const s of row.sport.split(";").map((v: string) => v.trim()).filter(Boolean)) {
        counts[s] = (counts[s] ?? 0) + 1;
      }
    }
  }

  return Object.entries(counts)
    .map(([sport, count]) => ({ sport, count }))
    .sort((a, b) => a.sport.localeCompare(b.sport));
}

export async function getTypes(): Promise<{ type: string; count: number }[]> {
  const data = await fetchAllColumn<{ type: string }>("games", "type");

  if (data.length === 0) return [];

  const counts: Record<string, number> = {};
  for (const row of data) {
    if (row.type) {
      for (const t of row.type.split(";").map((v: string) => v.trim()).filter(Boolean)) {
        counts[t] = (counts[t] ?? 0) + 1;
      }
    }
  }

  return Object.entries(counts)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);
}

// ================================================================
// DESIGNERS
// ================================================================

export async function getDesigners(): Promise<{ designer: string; count: number }[]> {
  const data = await fetchAllColumn<{ authors: string }>("games", "authors");

  if (data.length === 0) return [];

  const counts: Record<string, number> = {};
  for (const row of data) {
    if (row.authors) {
      for (const d of row.authors.split(";").map((v: string) => v.trim()).filter(Boolean)) {
        counts[d] = (counts[d] ?? 0) + 1;
      }
    }
  }

  return Object.entries(counts)
    .map(([designer, count]) => ({ designer, count }))
    .sort((a, b) => a.designer.localeCompare(b.designer));
}

export async function getDesignerStats(
  name: string
): Promise<{
  totalGames: number;
  yearMin: number | null;
  yearMax: number | null;
  topSports: string[];
  topType: string | null;
}> {
  const supabase = await createClient();
  const BATCH = 1000;
  const rows: { sport: string | null; type: string | null; year: number | null }[] = [];
  let offset = 0;

  while (true) {
    const { data } = await supabase
      .from("games")
      .select("sport, type, year")
      .or(`authors.eq.${name},authors.ilike.${name};%,authors.ilike.%; ${name},authors.ilike.%; ${name};%`)
      .range(offset, offset + BATCH - 1);

    if (!data || data.length === 0) break;
    rows.push(...data);
    if (data.length < BATCH) break;
    offset += BATCH;
  }

  if (rows.length === 0) {
    return { totalGames: 0, yearMin: null, yearMax: null, topSports: [], topType: null };
  }

  // Year range
  const years = rows.map((r) => r.year).filter((y): y is number => y != null && y > 0);
  const yearMin = years.length > 0 ? Math.min(...years) : null;
  const yearMax = years.length > 0 ? Math.max(...years) : null;

  // Top sports
  const sportCounts: Record<string, number> = {};
  for (const row of rows) {
    if (row.sport) {
      for (const s of row.sport.split(";").map((v) => v.trim()).filter(Boolean)) {
        sportCounts[s] = (sportCounts[s] ?? 0) + 1;
      }
    }
  }
  const topSports = Object.entries(sportCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([s]) => s);

  // Top type
  const typeCounts: Record<string, number> = {};
  for (const row of rows) {
    if (row.type) {
      for (const t of row.type.split(";").map((v) => v.trim()).filter(Boolean)) {
        typeCounts[t] = (typeCounts[t] ?? 0) + 1;
      }
    }
  }
  const topType =
    Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  return { totalGames: rows.length, yearMin, yearMax, topSports, topType };
}

// ================================================================
// RECENT ADDITIONS
// ================================================================

export async function getRecentGames(limit = 48): Promise<Game[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("games_with_views")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  return ((data ?? []) as Record<string, unknown>[]).map((row) => {
    const { total_views, community_avg, community_count, ...rest } = row;
    return {
      ...rest,
      view_count: (total_views as number) ?? 0,
      community_avg: (community_avg as number) ?? null,
      community_count: (community_count as number) ?? null,
    } as Game;
  });
}

// ================================================================
// VIEW COUNTS
// ================================================================

export async function incrementViewCount(gameId: number): Promise<void> {
  const supabase = await createClient();
  // Try to update existing row first
  const { data: existing } = await supabase
    .from("game_views")
    .select("view_count")
    .eq("game_id", gameId)
    .single();

  if (existing) {
    await supabase
      .from("game_views")
      .update({ view_count: existing.view_count + 1 })
      .eq("game_id", gameId);
  } else {
    await supabase
      .from("game_views")
      .insert({ game_id: gameId, view_count: 1 });
  }
}

export async function getTopGames(limit = 8): Promise<(Game & { view_count: number })[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("games_with_views")
    .select("*")
    .gt("total_views", 0)
    .order("total_views", { ascending: false })
    .limit(limit);

  if (!data) return [];

  return ((data as Record<string, unknown>[]).map((row) => {
    const { total_views, community_avg, community_count, ...rest } = row;
    return {
      ...rest,
      view_count: (total_views as number) ?? 0,
      community_avg: (community_avg as number) ?? null,
      community_count: (community_count as number) ?? null,
    } as Game;
  })) as (Game & { view_count: number })[];
}

// ================================================================
// COMMUNITY RATINGS
// ================================================================

export async function getGameRating(gameId: number): Promise<{ avg: number; count: number }> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ratings")
    .select("stars")
    .eq("game_id", gameId);

  if (!data || data.length === 0) return { avg: 0, count: 0 };

  const sum = data.reduce((acc: number, r: { stars: number }) => acc + r.stars, 0);
  return {
    avg: Math.round((sum / data.length) * 10) / 10,
    count: data.length,
  };
}

// ================================================================
// REVIEWS
// ================================================================

export async function getApprovedReviews(gameId: number): Promise<Review[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reviews")
    .select("*")
    .eq("game_id", gameId)
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  return (data ?? []) as Review[];
}

export async function getPendingReviews(): Promise<Review[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reviews")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  return (data ?? []) as Review[];
}

// ================================================================
// GAME SUBMISSIONS (Admin)
// ================================================================

export async function getPendingSubmissions(): Promise<GameSubmission[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("game_submissions")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  return (data ?? []) as GameSubmission[];
}

// ================================================================
// COMMENTS
// ================================================================

export async function getComments(gameId: number): Promise<Comment[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("comments")
    .select("*")
    .eq("game_id", gameId)
    .order("created_at", { ascending: false });

  return (data ?? []) as Comment[];
}

// ================================================================
// NEWS
// ================================================================

export async function getNews(limit = 5): Promise<NewsItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("news")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []) as NewsItem[];
}

// ================================================================
// SEARCH
// ================================================================

export async function searchGames(
  term: string,
  limit = 8
): Promise<{ id: number; name: string; sport: string | null; year: number | null; thumbnail_url: string | null }[]> {
  const supabase = await createClient();
  const pattern = `%${term}%`;
  const { data } = await supabase
    .from("games")
    .select("id, name, sport, year, thumbnail_url")
    .or(`name.ilike.${pattern},publisher_name.ilike.${pattern}`)
    .order("name", { ascending: true })
    .limit(limit);

  return (data ?? []) as { id: number; name: string; sport: string | null; year: number | null; thumbnail_url: string | null }[];
}

// ================================================================
// STATS / AGGREGATE QUERIES
// ================================================================

export async function getGamesByDecade(): Promise<{ decade: string; count: number }[]> {
  const data = await fetchAllColumn<{ year: number }>("games", "year");
  const buckets: Record<string, number> = {};

  for (const row of data) {
    if (row.year && row.year > 0) {
      const decade = `${Math.floor(row.year / 10) * 10}s`;
      buckets[decade] = (buckets[decade] ?? 0) + 1;
    }
  }

  return Object.entries(buckets)
    .map(([decade, count]) => ({ decade, count }))
    .sort((a, b) => a.decade.localeCompare(b.decade));
}

export async function getComplexityDistribution(): Promise<{ complexity: string; count: number }[]> {
  const data = await fetchAllColumn<{ complexity: string }>("games", "complexity");
  const order = ["Simple", "Medium", "Complex", "Expert"];
  const counts: Record<string, number> = {};

  for (const row of data) {
    if (row.complexity && order.includes(row.complexity)) {
      counts[row.complexity] = (counts[row.complexity] ?? 0) + 1;
    }
  }

  return order
    .filter((c) => counts[c])
    .map((complexity) => ({ complexity, count: counts[complexity] }));
}

export async function getTopPublishers(limit = 15): Promise<{ publisher: string; count: number }[]> {
  const data = await fetchAllColumn<{ publisher_name: string }>("games", "publisher_name");
  const counts: Record<string, number> = {};

  for (const row of data) {
    if (row.publisher_name) {
      counts[row.publisher_name] = (counts[row.publisher_name] ?? 0) + 1;
    }
  }

  return Object.entries(counts)
    .map(([publisher, count]) => ({ publisher, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export async function getPlayerCountDistribution(): Promise<{ category: string; count: number }[]> {
  const supabase = await createClient();
  const BATCH = 1000;
  const rows: { recommended_player_count_min: number | null; recommended_player_count_max: number | null }[] = [];
  let offset = 0;

  while (true) {
    const { data } = await supabase
      .from("games")
      .select("recommended_player_count_min, recommended_player_count_max")
      .range(offset, offset + BATCH - 1);

    if (!data || data.length === 0) break;
    rows.push(...data);
    if (data.length < BATCH) break;
    offset += BATCH;
  }

  const buckets: Record<string, number> = { Solo: 0, "2 Players": 0, "3-4 Players": 0, "5+ Players": 0 };

  for (const row of rows) {
    const min = row.recommended_player_count_min;
    const max = row.recommended_player_count_max;
    if (min == null && max == null) continue;
    if ((min ?? 99) <= 1 && (max ?? 0) >= 1) buckets["Solo"]++;
    if ((min ?? 99) <= 2 && (max ?? 0) >= 2) buckets["2 Players"]++;
    if ((min ?? 99) <= 4 && (max ?? 0) >= 3) buckets["3-4 Players"]++;
    if ((max ?? 0) >= 5) buckets["5+ Players"]++;
  }

  return Object.entries(buckets).map(([category, count]) => ({ category, count }));
}

export async function getYearRange(): Promise<{ min: number | null; max: number | null }> {
  const supabase = await createClient();

  const [{ data: minData }, { data: maxData }] = await Promise.all([
    supabase.from("games").select("year").not("year", "is", null).order("year", { ascending: true }).limit(1),
    supabase.from("games").select("year").not("year", "is", null).order("year", { ascending: false }).limit(1),
  ]);

  return {
    min: minData?.[0]?.year ?? null,
    max: maxData?.[0]?.year ?? null,
  };
}
