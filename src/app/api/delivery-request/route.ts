/**
 * POST /api/delivery-request — a resident asks the Water Neighbor site operator for help getting
 * water. Prototype: NOT an AAA or municipal service, no volunteer dispatch network, and it never
 * promises a delivery. No exact home address is requested or accepted (source-data privacy rule).
 */
import { z } from "zod";

import { inPuertoRico, roundApprox } from "@/lib/geo";
import {
  NO_STORE,
  invalid,
  issueFields,
  phone,
  rateLimited,
  readJson,
  text,
  tooMany,
} from "@/server/request-guards";
import { sendDeliveryRequest } from "@/server/telegram";

export const maxDuration = 15;

const bodySchema = z.object({
  locale: z.enum(["es", "en"]).default("es"),
  name: text(60).pipe(z.string().min(1)),
  phone,
  community: text(120).pipe(z.string().min(1)),
  needs: z
    .array(z.enum(["baby", "older_adult", "medical", "no_transport"]))
    .max(8)
    .default([])
    .transform((needs) => [...new Set(needs)]),
  note: text(280)
    .optional()
    .transform((value) => value || null),
  consent: z.literal(true),
  // Context the UI copies from the chat answer. Display only: never trusted for anything else.
  municipality: text(80)
    .nullish()
    .transform((value) => value || null),
  zone: z
    .enum(["zone1", "zone2"])
    .nullish()
    .transform((value) => value ?? null),
  noTransport: z.boolean().default(false),
  simulated: z.boolean().default(false),
  // Optional and opt-in. Rounded again here (±100 m) whatever the client sent; dropped outside Puerto Rico.
  approxLocation: z
    .object({ lat: z.number(), lng: z.number() })
    .nullish()
    .transform((at) => (at && inPuertoRico(at) ? roundApprox(at) : null)),
  // Display only: one line from the chat answer ("no service until …") shown to the site operator as context.
  statusSummary: text(120)
    .nullish()
    .transform((value) => value || null),
});

export async function POST(request: Request) {
  const body = await readJson(request);
  if (body === null) return invalid();

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return invalid(issueFields(parsed.error));

  // Only valid requests count: the limiter exists to keep the operator's chat from being flooded.
  if (rateLimited(request, "delivery")) return tooMany();

  const result = await sendDeliveryRequest(parsed.data);
  if (!result.delivered && result.reason === "telegram_error") {
    return Response.json(
      { ok: false, error: "notify_failed" },
      { status: 502, headers: NO_STORE },
    );
  }
  return Response.json(
    { ok: true, ...result, locationAccepted: parsed.data.approxLocation !== null },
    { status: 200, headers: NO_STORE },
  );
}
