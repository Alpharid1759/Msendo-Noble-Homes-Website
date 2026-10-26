// src/app/opengraph-image.tsx
import { ImageResponse } from "next/og";

export const alt = "Msendo Noble Homes: Property. Opportunity. Confidence.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0f1d30",
          color: "#ffffff",
          padding: "72px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="72" height="72" viewBox="0 0 40 40">
            <path d="M4 18 L20 5 L36 18" fill="none" stroke="#c2a46d" strokeWidth="2.4" />
            <path d="M9 17 V35 H31 V17" fill="none" stroke="#ffffff" strokeWidth="2.4" />
            <path d="M15 35 V22 L25 30 V22" fill="none" stroke="#ffffff" strokeWidth="2.4" />
          </svg>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 40, letterSpacing: 10, fontWeight: 700 }}>MSENDO</span>
            <span style={{ fontSize: 20, letterSpacing: 12, color: "#c2a46d" }}>NOBLE HOMES</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 68, lineHeight: 1.1 }}>Find a property that fits your ambition.</span>
          <span style={{ fontSize: 30, marginTop: 24, color: "#c2a46d" }}>Property. Opportunity. Confidence.</span>
        </div>
        <span style={{ fontSize: 24, color: "#b9c3d1" }}>Homes, land and commercial property in Abuja</span>
      </div>
    ),
    size,
  );
}
