/**
 * Shared trust-boundary helpers for the public form routes (water help requests, volunteer
 * sign-ups): text sanitising, phone normalising, a small rate limiter and the error responses.
 */
import "server-only";

import { z } from "zod";

export const NO_STORE = { "Cache-Control": "no-store" };

/** Caps the raw length, strips control/format characters (newlines, bidi overrides, zero-width), trims. */
export const text = (max: number) =>
  z
    .string()
    .max(max)
    .transform((value) => value.replace(/\p{C}+/gu, " ").trim());

/** PR/US formats: "(787) 555-1234", "787-555-1234", "+1 787 555 1234" → 10 digits. */
export const phone = z
  .string()
  .max(30)
  .transform((value) => value.replace(/\D/g, ""))
  .pipe(z.string().regex(/^1?[2-9]\d{9}$/))
  .transform((digits) => digits.slice(-10));

// ponytail: per-instance in-memory limiter (resets on restart, not shared across serverless
// instances, trusts x-forwarded-for). Move to a shared store (Upstash/Redis) or the platform WAF if this ships.
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

/** `bucket` keeps the routes' budgets apart: five requests per IP per bucket per ten minutes. */
export function rateLimited(request: Request, bucket: string): boolean {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const key = `${bucket}:${ip}`;
  const now = Date.now();
  if (hits.size > 1000) hits.clear();
  const recent = (hits.get(key) ?? []).filter((at) => now - at < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(key, recent);
    return true;
  }
  hits.set(key, [...recent, now]);
  return false;
}

export const invalid = (fields?: string[]) =>
  Response.json(
    { ok: false, error: "invalid_request", ...(fields && { fields }) },
    { status: 400, headers: NO_STORE },
  );

export const tooMany = () =>
  Response.json({ ok: false, error: "rate_limited" }, { status: 429, headers: NO_STORE });

/** Parses a small JSON body; null when it is too big or not JSON. */
export async function readJson(request: Request): Promise<unknown | null> {
  if (Number(request.headers.get("content-length")) > 4096) return null;
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export const issueFields = (error: z.ZodError) => [
  ...new Set(error.issues.map((issue) => String(issue.path[0] ?? "body"))),
];
