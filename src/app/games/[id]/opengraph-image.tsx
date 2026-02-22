import { ImageResponse } from "next/og";
import { createClient } from "@/lib/supabase/server";

export const runtime = "edge";
export const alt = "Game details";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const SPORT_COLORS: Record<string, string> = {
  "American Football": "#d4531a",
  Football: "#d4531a",
  Baseball: "#c44b3b",
  Basketball: "#e07b39",
  "Ice Hockey": "#4a84b8",
  Hockey: "#4a84b8",
  Soccer: "#4d8464",
  Tennis: "#c8b83a",
  Golf: "#5a7c42",
  "Auto Racing": "#d4a843",
  Racing: "#d4a843",
  Cricket: "#b5863a",
  Rugby: "#8b5e3c",
  Cycling: "#4a84b8",
  Boxing: "#c44b3b",
};

function getSportColor(sport: string | null): string {
  if (!sport) return "#d4a843";
  // Handle semicolon-separated sports — use the first one
  const first = sport.split(";")[0]?.trim();
  return (first && SPORT_COLORS[first]) || "#d4a843";
}

export default async function GameOGImage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const fontData = await fetch(
    new URL(
      "/fonts/oswald-bold.ttf",
      process.env.NEXT_PUBLIC_SITE_URL || "https://tabletopsportsarchive.com"
    )
  ).then((res) => res.arrayBuffer());

  // Fetch game data
  const supabase = await createClient();
  const { data: game } = await supabase
    .from("games")
    .select("name, sport, year, image_url, thumbnail_url, top_image_url")
    .eq("id", Number(id))
    .single();

  if (!game) {
    // Fallback for missing game
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#0d0b08",
            fontFamily: "Oswald",
            color: "#f5f0e8",
            fontSize: 48,
          }}
        >
          Game Not Found
        </div>
      ),
      {
        ...size,
        fonts: [
          { name: "Oswald", data: fontData, style: "normal" as const, weight: 700 as const },
        ],
      }
    );
  }

  const sportColor = getSportColor(game.sport);
  const primarySport = game.sport?.split(";")[0]?.trim() || "";
  const imageUrl = game.top_image_url || game.image_url || game.thumbnail_url;

  // Auto-size title: shorter titles get bigger font
  const titleLen = game.name.length;
  const titleFontSize = titleLen > 60 ? 36 : titleLen > 40 ? 44 : titleLen > 25 ? 52 : 60;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#0d0b08",
          fontFamily: "Oswald",
          position: "relative",
        }}
      >
        {/* Sport color accent bar at top */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 6,
            background: sportColor,
          }}
        />

        {/* Main content */}
        <div
          style={{
            display: "flex",
            flex: 1,
            padding: "50px 60px 30px",
            gap: 50,
          }}
        >
          {/* Left: Text content */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              flex: 1,
              gap: 16,
            }}
          >
            {/* Sport badge */}
            {primarySport && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    background: sportColor,
                  }}
                />
                <span
                  style={{
                    fontSize: 20,
                    color: sportColor,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                  }}
                >
                  {primarySport}
                </span>
              </div>
            )}

            {/* Game name */}
            <div
              style={{
                fontSize: titleFontSize,
                fontWeight: 700,
                color: "#f5f0e8",
                lineHeight: 1.15,
                textTransform: "uppercase",
                letterSpacing: "-0.01em",
                display: "flex",
              }}
            >
              {game.name}
            </div>

            {/* Year */}
            {game.year && (
              <div
                style={{
                  fontSize: 24,
                  color: "#a09888",
                }}
              >
                {game.year}
              </div>
            )}
          </div>

          {/* Right: Game cover image */}
          {imageUrl && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
              <img
                src={imageUrl}
                width={280}
                height={360}
                style={{
                  borderRadius: 12,
                  objectFit: "cover",
                  border: "2px solid rgba(245,240,232,0.1)",
                }}
              />
            </div>
          )}
        </div>

        {/* Bottom bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 60px 30px",
          }}
        >
          {/* TS badge + site name */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 36,
                height: 36,
                borderRadius: 6,
                background: "#d4a843",
              }}
            >
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#0d0b08",
                }}
              >
                TS
              </span>
            </div>
            <span
              style={{
                fontSize: 16,
                color: "#a09888",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Tabletop Sports Games Archive
            </span>
          </div>

          {/* Gold accent line */}
          <div
            style={{
              width: 60,
              height: 3,
              background: "#d4a843",
            }}
          />
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Oswald",
          data: fontData,
          style: "normal" as const,
          weight: 700 as const,
        },
      ],
    }
  );
}
