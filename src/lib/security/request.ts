// src/lib/security/request.ts
import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { serverEnv } from "@/lib/server-env";

export async function getClientIp() {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return h.get("x-real-ip") ?? h.get("cf-connecting-ip") ?? "unknown";
}

export function hashValue(value: string) {
  return createHash("sha256").update(`${serverEnv.ipHashSalt}:${value}`).digest("hex").slice(0, 32);
}

export async function getRequestFingerprint() {
  const h = await headers();
  const ip = await getClientIp();
  return {
    ipHash: hashValue(ip),
    userAgent: (h.get("user-agent") ?? "").slice(0, 300),
    referer: h.get("referer") ?? null,
  };
}
