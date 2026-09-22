/**
 * GET /api/reservoir — latest USGS Carraízo level as a ReservoirResponse.
 *
 * Never an error: any failure (timeout, bad feed, USGS down) is 200 `{ ok: false }` and the chip
 * simply does not render. The USGS fetch is cached 10 minutes in Next's data cache. Do NOT add
 * `dynamic = "force-dynamic"` here: it forces every fetch to no-store and kills that cache.
 */
import { USGS_FEED_URL, parseUsgsFeed, type ReservoirResponse } from "@/lib/reservoir";

export const maxDuration = 10;

export async function GET() {
  let body: ReservoirResponse = { ok: false };
  try {
    const res = await fetch(USGS_FEED_URL, {
      next: { revalidate: 600 },
      signal: AbortSignal.timeout(5000),
      headers: { Accept: "application/json" },
    });
    const reading = res.ok ? parseUsgsFeed(await res.json()) : null;
    if (reading) body = { ok: true, ...reading };
  } catch {
    // fall through to { ok: false }
  }
  return Response.json(body, {
    status: 200,
    headers: { "Cache-Control": body.ok ? "public, max-age=300" : "no-store" },
  });
}
