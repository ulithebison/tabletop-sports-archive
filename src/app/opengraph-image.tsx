import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Tabletop Sports Games Archive";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage() {
  const fontData = await fetch(
    new URL("/fonts/oswald-bold.ttf", process.env.NEXT_PUBLIC_SITE_URL || "https://tabletopsportsarchive.com")
  ).then((res) => res.arrayBuffer());

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "#0d0b08",
          fontFamily: "Oswald",
          position: "relative",
        }}
      >
        {/* Top accent line */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 6,
            background: "#d4a843",
          }}
        />

        {/* TS badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 80,
            height: 80,
            borderRadius: 12,
            background: "#d4a843",
            marginBottom: 32,
          }}
        >
          <span
            style={{
              fontSize: 40,
              fontWeight: 700,
              color: "#0d0b08",
              letterSpacing: "0.02em",
            }}
          >
            TS
          </span>
        </div>

        {/* Site name */}
        <div
          style={{
            fontSize: 56,
            fontWeight: 700,
            color: "#f5f0e8",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            textAlign: "center",
            lineHeight: 1.1,
          }}
        >
          Tabletop Sports
        </div>
        <div
          style={{
            fontSize: 56,
            fontWeight: 700,
            color: "#f5f0e8",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            textAlign: "center",
            lineHeight: 1.1,
            marginBottom: 20,
          }}
        >
          Games Archive
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 22,
            color: "#a09888",
            textAlign: "center",
            maxWidth: 700,
          }}
        >
          The definitive database of physical sports simulation games
        </div>

        {/* Bottom accent line */}
        <div
          style={{
            position: "absolute",
            bottom: 40,
            left: "50%",
            transform: "translateX(-50%)",
            width: 120,
            height: 3,
            background: "#d4a843",
          }}
        />
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Oswald",
          data: fontData,
          style: "normal",
          weight: 700,
        },
      ],
    }
  );
}
