/**
 * POST /api/volunteer — someone offers to volunteer. The sign-up goes to the site operator on
 * Telegram; nothing is stored here. The operator talks to them before adding them to the volunteer
 * group, because requests in that group include residents' phone numbers.
 */
import { z } from "zod";

import { MUNICIPALITIES } from "@/lib/plan";
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
import { sendVolunteerSignup } from "@/server/telegram";

export const maxDuration = 15;

const unique = <T>(items: T[]) => [...new Set(items)];

const bodySchema = z.object({
  name: text(60).pipe(z.string().min(1)),
  phone,
  // Telegram usernames: 5–32 of letters, digits, underscore. A leading "@" is fine.
  telegram: z
    .string()
    .max(40)
    .transform((value) => value.trim().replace(/^@/, ""))
    .pipe(z.union([z.literal(""), z.string().regex(/^[A-Za-z][A-Za-z0-9_]{4,31}$/)]))
    .optional()
    .transform((value) => value || null),
  municipalities: z
    .array(z.string().refine((name) => MUNICIPALITIES.includes(name)))
    .min(1)
    .max(MUNICIPALITIES.length)
    .transform(unique),
  help: z.array(z.enum(["deliver", "calls", "translate"])).min(1).max(3).transform(unique),
  availability: z
    .array(z.enum(["weekdays", "evenings", "weekends"]))
    .max(3)
    .default([])
    .transform(unique),
  hasVehicle: z.boolean().default(false),
  languages: z.array(z.enum(["es", "en"])).min(1).max(2).transform(unique),
  note: text(280)
    .optional()
    .transform((value) => value || null),
  consent: z.literal(true),
});

export async function POST(request: Request) {
  const body = await readJson(request);
  if (body === null) return invalid();

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return invalid(issueFields(parsed.error));
  if (rateLimited(request, "volunteer")) return tooMany();

  const result = await sendVolunteerSignup(parsed.data);
  if (!result.delivered && result.reason === "telegram_error") {
    return Response.json({ ok: false, error: "notify_failed" }, { status: 502, headers: NO_STORE });
  }
  return Response.json({ ok: true, ...result }, { status: 200, headers: NO_STORE });
}
