/**
 * Sends a resident's water help request to the Water Neighbor site operator on Telegram. Prototype:
 * there is no volunteer dispatch network, and this is not an AAA or municipal service.
 * Never logs the token, the URL, or resident data.
 */
import "server-only";

import { AAA_LINE } from "@/lib/contacts";
import type { LatLng } from "@/lib/geo";
import { ommeContact } from "@/lib/plan";

export type DeliveryNeed = "baby" | "older_adult" | "medical" | "no_transport";

export type DeliveryRequestData = {
  name: string;
  /** 10 digits, already normalized. */
  phone: string;
  community: string;
  municipality: string | null;
  zone: "zone1" | "zone2" | null;
  needs: DeliveryNeed[];
  note: string | null;
  locale: "es" | "en";
  /** The resident said "no tengo carro" in the chat, whether or not they ticked the chip. */
  noTransport: boolean;
  simulated: boolean;
  /** Optional, resident opted in. Already rounded to 3 decimals (±100 m) and inside Puerto Rico. */
  approxLocation: LatLng | null;
  /** Display only, from the chat answer, e.g. "no service until Sat, Aug 15, 6:00 AM (per the published AAA calendar)". */
  statusSummary?: string | null;
};

export type DeliveryNotifyResult =
  | { delivered: true }
  | { delivered: false; reason: "not_configured" | "telegram_error" };

const NEED_LABELS: Record<DeliveryNeed, string> = {
  baby: "baby at home",
  older_adult: "older adult",
  medical: "bedridden or medical condition",
  no_transport: "no transportation",
};

/**
 * A short brief the site operator can act on from their phone. English, plain text on purpose: no
 * parse_mode, so nothing a resident types can become formatting or a link. It never sends anyone to
 * a site named in the plan: AAA published no address for them and public access is unconfirmed.
 */
export function formatDeliveryMessage(
  data: DeliveryRequestData,
  at = new Date(),
): string {
  const { name, approxLocation: loc } = data;
  // The OMME number comes from OUR copy of the notice, never from the client.
  const omme = data.municipality ? ommeContact(data.municipality) : null;
  const needs = data.needs.map((need) => NEED_LABELS[need]);
  if (data.noTransport && !data.needs.includes("no_transport"))
    needs.push("no transportation (said in the chat)");
  const place = [data.community, data.municipality].filter(Boolean).join(", ");
  // Both forms: the first is easy to read out, the second is the one Telegram reliably makes tappable.
  const phone = `(${data.phone.slice(0, 3)}) ${data.phone.slice(3, 6)}-${data.phone.slice(6)} · tap to call: +1${data.phone}`;
  const status = [
    data.zone && `Zone ${data.zone === "zone1" ? 1 : 2}`,
    data.statusSummary,
  ]
    .filter(Boolean)
    .join(" · ");
  const when = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Puerto_Rico",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(at);

  return [
    "WATER HELP REQUEST (prototype)",
    "",
    `${name} asked for help getting water in ${place}.`,
    needs.length > 0 && `Household: ${needs.join(" · ")}`,
    data.note && `Note: "${data.note}"`,
    `Speaks: ${data.locale === "en" ? "English" : "Spanish"}`,
    "",
    "WHAT TO DO",
    `1. Call ${name}: ${phone}`,
    "2. Ask what they need and where a safe hand-off spot is (we never collect street addresses).",
    `3. Point them to ${omme?.phones[0] ? `${omme.agency}: ${omme.phones[0]}` : "their municipal emergency office (OMME)"} and ${AAA_LINE.name} ${AAA_LINE.display}.`,
    loc && `4. Approximate location (±100 m): https://www.google.com/maps/search/?api=1&query=${loc.lat}%2C${loc.lng}`,
    "",
    status || null,
    `Sent ${when} (Puerto Rico time)${data.simulated ? " · sent while the app was in replay mode (not today's status)" : ""}`,
  ]
    .filter((line) => line === "" || Boolean(line))
    .join("\n");
}

/** Plain-text message to one chat. `tag` only labels the log line; nothing personal is ever logged. */
async function sendToChat(
  chatId: string | undefined,
  text: string,
  tag: string,
): Promise<DeliveryNotifyResult> {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!token || !chatId) return { delivered: false, reason: "not_configured" };

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
        signal: AbortSignal.timeout(6000),
      },
    );
    if (res.ok) return { delivered: true };
    console.error(`[${tag}] telegram failed`, res.status);
  } catch (error) {
    // Only the error name: a fetch error's message or cause can carry the URL, which holds the token.
    console.error(`[${tag}] telegram failed`, error instanceof Error ? error.name : "unknown");
  }
  return { delivered: false, reason: "telegram_error" };
}

/** Water help requests go to TELEGRAM_CHAT_ID: the operator's chat, or the volunteer group. */
export function sendDeliveryRequest(data: DeliveryRequestData): Promise<DeliveryNotifyResult> {
  return sendToChat(
    process.env.TELEGRAM_CHAT_ID?.trim(),
    formatDeliveryMessage(data),
    "delivery-request",
  );
}

export type VolunteerSignup = {
  name: string;
  /** 10 digits, already normalized. */
  phone: string;
  /** Without the leading "@"; null when not given. */
  telegram: string | null;
  municipalities: string[];
  help: ("deliver" | "calls" | "translate")[];
  availability: ("weekdays" | "evenings" | "weekends")[];
  hasVehicle: boolean;
  languages: ("es" | "en")[];
  note: string | null;
};

const HELP_LABELS = { deliver: "deliver water", calls: "make phone calls", translate: "translate" };

export function formatVolunteerMessage(v: VolunteerSignup, at = new Date()): string {
  const phone = `(${v.phone.slice(0, 3)}) ${v.phone.slice(3, 6)}-${v.phone.slice(6)} · tap to call: +1${v.phone}`;
  const when = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Puerto_Rico",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(at);
  return [
    "NEW VOLUNTEER SIGN-UP",
    "",
    `${v.name} wants to volunteer with Water Neighbor.`,
    `Phone: ${phone}`,
    v.telegram ? `Telegram: @${v.telegram} · https://t.me/${v.telegram}` : "Telegram: not given, reach them by phone",
    `Covers: ${v.municipalities.join(", ")}`,
    `Can: ${v.help.map((h) => HELP_LABELS[h]).join(" · ")}`,
    `Vehicle: ${v.hasVehicle ? "yes" : "no"}`,
    v.availability.length > 0 && `Available: ${v.availability.join(" · ")}`,
    `Speaks: ${v.languages.map((l) => (l === "en" ? "English" : "Spanish")).join(" · ")}`,
    v.note && `Note: "${v.note}"`,
    "",
    "NEXT STEP",
    "Talk to them first, then add them to the volunteer group. Requests in that group include residents' phone numbers, so only add people you have spoken with.",
    "",
    `Sent ${when} (Puerto Rico time)`,
  ]
    .filter((line) => line === "" || Boolean(line))
    .join("\n");
}

/**
 * Sign-ups carry the volunteer's own phone number, so they go to the operator only
 * (TELEGRAM_OPERATOR_CHAT_ID), never to the whole group. Falls back to TELEGRAM_CHAT_ID.
 */
export function sendVolunteerSignup(v: VolunteerSignup): Promise<DeliveryNotifyResult> {
  return sendToChat(
    process.env.TELEGRAM_OPERATOR_CHAT_ID?.trim() || process.env.TELEGRAM_CHAT_ID?.trim(),
    formatVolunteerMessage(v),
    "volunteer",
  );
}
