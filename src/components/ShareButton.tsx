"use client";

import { useState } from "react";
import { residentChat } from "@/i18n/resident-chat";
import type { ChatLocale, ChatResponse } from "@/lib/chat-contract";
import { AAA_LINE } from "@/lib/contacts";

const TIME_ZONE = "America/Puerto_Rico";
const tagOf = (locale: ChatLocale) => (locale === "es" ? "es-PR" : "en-US");

/** "Sep 17, 2026" for a YYYY-MM-DD date or an ISO instant, read in Puerto Rico. */
export function shortDate(value: string, locale: ChatLocale): string {
  const date = new Date(value.length === 10 ? `${value}T12:00:00-04:00` : value);
  return new Intl.DateTimeFormat(tagOf(locale), { timeZone: TIME_ZONE, month: "short", day: "numeric", year: "numeric" }).format(date);
}

/** The one status headline, shared by the card and the forwarded text. Replay is phrased as a past date, never "now". */
export function statusLine(response: ChatResponse, locale: ChatLocale): string | null {
  const t = residentChat[locale];
  const { status } = response;
  if (!status) return null;
  if (status.kind === "plan_not_active") {
    return status.phase === "ended" && status.endedReportedOn
      ? t.planEnded.replace("{date}", shortDate(status.endedReportedOn, locale))
      : t.planPaused.replace("{date}", shortDate(status.pausedAt, locale));
  }
  if (status.kind === "in_calendar") {
    const on = status.state === "with_service";
    const line = response.simulated
      ? on ? t.withServiceThen : t.noServiceThen
      : on ? t.withServiceNow : t.noServiceNow;
    if (!status.nextChangeAt) return line;
    const when = new Intl.DateTimeFormat(tagOf(locale), {
      timeZone: TIME_ZONE,
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
    });
    return `${line} · ${on ? t.stops : t.dueBack} ${when.format(new Date(status.nextChangeAt))}`;
  }
  const through = new Date(`${status.calendarPublishedThrough}T23:59:59-04:00`);
  const ended = Date.parse(response.now) > through.getTime();
  return `${ended ? t.calendarEnded : t.calendarOutside} ${shortDate(status.calendarPublishedThrough, locale)}`;
}

/** Plain-text summary for WhatsApp, built only from structured fields (never the model's free text). */
export function shareText(response: ChatResponse, locale: ChatLocale): string {
  const t = residentChat[locale];
  const { community, municipality, zone, status, location, contact, source } = response;
  const omme = contact?.phones[0] ? `${contact.agency} ${contact.phones[0]}` : null;
  const callAaa = `${t.share.noWater.replace("{aaa}", AAA_LINE.display)}${omme ? ` ${t.share.or} ${omme}` : ""}.`;
  const lines: string[] = [];

  // A forwarded message must never pass for today's status.
  if (response.simulated) {
    const longDate = new Intl.DateTimeFormat(tagOf(locale), { timeZone: TIME_ZONE, dateStyle: "long" });
    lines.push(`[${t.share.replay.replace("{date}", longDate.format(new Date(response.now)))}]`);
  }

  lines.push(`${[community, municipality].filter(Boolean).join(", ")} · ${t.zone} ${zone === "zone1" ? 1 : 2}`);

  if (status?.kind === "plan_not_active") {
    const ended = status.phase === "ended" && status.endedReportedOn;
    lines.push(
      `${(ended ? t.share.ended : t.share.paused).replace("{date}", shortDate(ended || status.pausedAt, locale))} ${callAaa}`,
    );
  } else {
    const line = statusLine(response, locale);
    if (line) lines.push(line);
    // The site is only worth forwarding for the dates the plan ran.
    if (location) {
      lines.push(`${t.share.point} ${location.name} (${t.share.unconfirmed}) · ${t.listedHours} ${location.listedHours}`);
    }
    lines.push(callAaa);
  }
  lines.push(`${t.source} ${source.title} ${t.share.sourceSuffix}`);
  return lines.join("\n");
}

const BUTTON = "min-h-11 rounded-control px-4 py-2 text-sm font-semibold";

export function ShareButton({ response, locale }: { response: ChatResponse; locale: ChatLocale }) {
  const [copied, setCopied] = useState(false);
  if (response.needsClarification || !response.zone) return null;
  const t = residentChat[locale].share;

  // Feature detection happens on click, never during render, so server and client markup match.
  async function share() {
    const text = shareText(response, locale);
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ text });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return; // resident cancelled
      }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  }

  async function copy() {
    try {
      // ponytail: no execCommand fallback; clipboard is undefined on plain-http LAN origins, where Share → WhatsApp still works.
      await navigator.clipboard.writeText(shareText(response, locale));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // nothing copied, nothing claimed
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => void share()}
        className={`${BUTTON} min-w-0 flex-1 text-action hover:bg-action-soft`}
      >
        {t.button}
      </button>
      <button
        type="button"
        onClick={() => void copy()}
        className={`${BUTTON} shrink-0 border border-line text-muted hover:bg-chip hover:text-ink`}
      >
        {t.copy}
      </button>
      <span role="status" className="text-xs text-muted">
        {copied ? t.copied : ""}
      </span>
    </div>
  );
}
