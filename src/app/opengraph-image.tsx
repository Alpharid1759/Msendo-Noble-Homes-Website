// src/app/opengraph-image.tsx
import { readFileSync } from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";

export const alt = "Msendo Noble Homes: Property. Opportunity. Confidence.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  const mark = `data:image/png;base64,${readFileSync(path.join(process.cwd(), "public/brand/mark.png")).toString("base64")}`;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "radial-gradient(ellipse at 75% 10%, #1d3a2b 0%, #0a0d0b 65%)",
          color: "#f6f1e6",
          padding: "72px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div style={{ display: "flex", background: "#fffdf7", borderRadius: 14, padding: 12 }}>
            <img src={mark} width={150} height={75} alt="" />
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 52, fontWeight: 700 }}>Msendo</span>
            <span style={{ fontSize: 22, letterSpacing: 10, color: "#f0bd45" }}>NOBLE HOMES</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 66, lineHeight: 1.08 }}>FIND A PROPERTY THAT FITS YOUR AMBITION.</span>
          <span style={{ fontSize: 30, marginTop: 24, color: "#f0bd45" }}>Property. Opportunity. Confidence.</span>
        </div>
        <span style={{ fontSize: 24, color: "#aba9a0" }}>Homes, land and commercial property in Abuja</span>
      </div>
    ),
    size,
  );
}
