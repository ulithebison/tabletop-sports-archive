import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";
import { getSports, getTypes, getDesigners } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

async function getAllGameIds(): Promise<number[]> {
  const supabase = await createClient();
  const BATCH = 1000;
  const ids: number[] = [];
  let offset = 0;

  while (true) {
    const { data } = await supabase
      .from("games")
      .select("id")
      .order("id", { ascending: true })
      .range(offset, offset + BATCH - 1);

    if (!data || data.length === 0) break;
    ids.push(...data.map((row) => row.id));
    if (data.length < BATCH) break;
    offset += BATCH;
  }

  return ids;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${SITE_URL}/games`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/browse/sport`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/browse/type`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/recent`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: `${SITE_URL}/popular`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: `${SITE_URL}/stats`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/designers`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/submit/game`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_URL}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
  ];

  // Dynamic: all game detail pages
  const [gameIds, sports, types, designers] = await Promise.all([
    getAllGameIds(),
    getSports(),
    getTypes(),
    getDesigners(),
  ]);

  const gamePages: MetadataRoute.Sitemap = gameIds.map((id) => ({
    url: `${SITE_URL}/games/${id}`,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  // Dynamic: sport browse pages
  const sportPages: MetadataRoute.Sitemap = sports.map(({ sport }) => ({
    url: `${SITE_URL}/browse/sport/${encodeURIComponent(sport)}`,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // Dynamic: type browse pages
  const typePages: MetadataRoute.Sitemap = types.map(({ type }) => ({
    url: `${SITE_URL}/browse/type/${encodeURIComponent(type)}`,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // Dynamic: designer pages
  const designerPages: MetadataRoute.Sitemap = designers.map(({ designer }) => ({
    url: `${SITE_URL}/designers/${encodeURIComponent(designer)}`,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...gamePages, ...sportPages, ...typePages, ...designerPages];
}
