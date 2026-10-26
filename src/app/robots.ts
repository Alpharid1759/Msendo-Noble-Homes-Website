// src/app/robots.ts
import type { MetadataRoute } from "next";
import { publicEnv } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const allowIndexing = process.env.NEXT_PUBLIC_ALLOW_INDEXING === "true";
  return {
    rules: allowIndexing
      ? [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/auth", "/thank-you", "/newsletter"] }]
      : [{ userAgent: "*", disallow: "/" }],
    sitemap: `${publicEnv.siteUrl}/sitemap.xml`,
    host: publicEnv.siteUrl,
  };
}
