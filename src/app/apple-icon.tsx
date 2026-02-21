import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#d4a843",
          borderRadius: 32,
        }}
      >
        <span
          style={{
            fontSize: 100,
            fontWeight: 700,
            color: "#0d0b08",
            letterSpacing: -4,
          }}
        >
          TS
        </span>
      </div>
    ),
    { ...size }
  );
}
