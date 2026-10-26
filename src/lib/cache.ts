// src/lib/cache.ts
import "server-only";
import { unstable_cache } from "next/cache";
import { isSupabaseConfigured } from "@/lib/env";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFn = (...args: any[]) => Promise<any>;

export function cachedQuery<T extends AnyFn>(fn: T, keyParts: string[], options: { tags: string[]; revalidate: number }): T {
  const cached = unstable_cache(fn, keyParts, options);
  return ((...args: Parameters<T>) => (isSupabaseConfigured() ? cached(...args) : fn(...args))) as T;
}
