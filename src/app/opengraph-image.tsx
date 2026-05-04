import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Kendrick Serrano — Web & Mobile Developer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#000",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          padding: "80px",
        }}
      >
        <div
          style={{
            fontSize: "96px",
            fontWeight: 900,
            color: "#fff",
            lineHeight: 0.95,
            letterSpacing: "-0.02em",
          }}
        >
          Kendrick Serrano
        </div>
        <div
          style={{
            fontSize: "32px",
            color: "rgba(255,255,255,0.55)",
            marginTop: "24px",
          }}
        >
          UI/UX · Web &amp; Mobile · Tugbungan, Zamboanga City
        </div>
        <div
          style={{
            position: "absolute",
            bottom: "80px",
            left: "80px",
            width: "48px",
            height: "4px",
            background: "#4d65ff",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
