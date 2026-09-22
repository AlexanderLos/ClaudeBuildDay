/**
 * POST /api/chat — resident message in, ChatResponse out.
 *
 * Only a malformed body is an error. A Claude failure is never one: `chat()` falls back to the
 * deterministic answer, so the resident always gets the facts.
 */
import { z } from "zod";

import { chat } from "@/server/chat";

/** One short model call with an 8s abort; nothing here runs long. */
export const maxDuration = 30;

const NO_STORE = { "Cache-Control": "no-store" };

const bodySchema = z.object({
  message: z.string().trim().min(1).max(500),
  locale: z.enum(["es", "en"]).default("es"),
  // Truth by default: the real current time. Replay is opt-in.
  simulateDate: z.boolean().default(false),
  replayDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  previousUserMessages: z.array(z.string().max(500)).max(10).optional(),
});

export async function POST(request: Request) {
  try {
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return Response.json({ error: "invalid_request" }, { status: 400, headers: NO_STORE });
    }
    return Response.json(await chat(parsed.data), { status: 200, headers: NO_STORE });
  } catch {
    return Response.json({ error: "invalid_request" }, { status: 400, headers: NO_STORE });
  }
}
