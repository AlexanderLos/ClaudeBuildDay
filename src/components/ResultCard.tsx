"use client";

import { DeliveryRequest } from "@/components/DeliveryRequest";
import { ShareButton, statusLine } from "@/components/ShareButton";
import { ZoneCalendar } from "@/components/ZoneCalendar";
import { residentChat, sourceName } from "@/i18n/resident-chat";
import type { ChatLocale, ChatResponse } from "@/lib/chat-contract";
import { AAA_LINE } from "@/lib/contacts";
import { PLAN_STATUS } from "@/lib/plan-status";

/** PR numbers are 10 digits; keep the last 10 so "(787) 555-1234 ext." still dials. */
function telHref(phone: string): string {
  return `tel:+1${phone.replace(/\D/g, "").slice(-10)}`;
}

// `rounded-control` is a full pill: single-line buttons only. The two-line OMME button uses a card radius.
const BUTTON = "flex min-h-11 w-full items-center justify-center px-4 py-2 text-center text-sm font-semibold break-words";
const LINK = "inline-flex min-h-11 items-center font-medium text-action underline underline-offset-2";

// Attached to the bubble above it: same left edge, small gap.
const CARD = "mt-1.5 w-full min-w-0 rounded-card border border-line bg-surface p-4 text-sm text-ink shadow-card";

export function ResultCard({ response, locale }: { response: ChatResponse; locale: ChatLocale }) {
  const { community, municipality, zone, status, location, otherLocations, contact, source } = response;

  // The bot is still asking (or just chatting): the bubble is the answer. If the municipality is
  // known, one quiet line with its OMME numbers, never a wall of call buttons.
  if (response.needsClarification || !zone) {
    if (!contact) return null;
    return (
      <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5 px-1 text-sm break-words text-muted">
        <span>{contact.agency}:</span>
        {contact.phones.map((phone, index) => (
          <span key={phone} className="inline-flex items-center gap-x-1.5">
            {index > 0 && <span aria-hidden="true">·</span>}
            <a href={telHref(phone)} className={`${LINK} whitespace-nowrap`}>
              {phone}
            </a>
          </span>
        ))}
      </p>
    );
  }

  const t = residentChat[locale];
  const replay = response.simulated;
  const notActive = status?.kind === "plan_not_active";
  const longDate = new Intl.DateTimeFormat(locale === "es" ? "es-PR" : "en-US", {
    timeZone: "America/Puerto_Rico",
    dateStyle: "long",
  }).format(new Date(response.now));

  // One primary button (first number); a second number is a text link under it, not a twin button.
  const callButtons = contact && contact.phones.length > 0 && (
    <div>
      <a href={telHref(contact.phones[0])} className={`${BUTTON} flex-col rounded-2xl bg-action text-white hover:bg-action-hover`}>
        <span>
          {t.call} {contact.agency}
        </span>
        <span className="text-xs font-normal">{contact.phones[0]}</span>
      </a>
      {contact.phones.slice(1).map((phone) => (
        <p key={phone} className="text-center text-xs text-muted">
          {t.callAlt}{" "}
          <a href={telHref(phone)} className={`${LINK} whitespace-nowrap`}>
            {phone}
          </a>
        </p>
      ))}
    </div>
  );

  const statusText = statusLine(response, locale);
  const statusTone =
    status?.kind === "in_calendar" && status.state === "without_service"
      ? "border-danger-line bg-danger-soft text-danger"
      : status?.kind === "outside_calendar"
        ? "border-review-line bg-review-soft text-review"
        : "border-success-line bg-success-soft text-success";
  const statusSource = notActive ? PLAN_STATUS.sources[status.phase] : null;

  // A site the plan NAMES, never a confirmed water point: AAA published no address and no public access.
  const siteRow = location ? (
    <div>
      <p className="text-xs leading-5 font-medium text-muted">{t.card.pointLabel}</p>
      <p className="text-sm leading-6 font-semibold break-words text-ink">{location.name}</p>
      <p className="text-xs leading-snug break-words text-muted">{t.officialLabel}</p>
      <p className="mt-0.5 text-sm break-words text-muted">
        {/* The notice writes hours in Spanish ("9:00 a.m. a 7:00 p.m."); only the separator needs translating. */}
        {t.listedHours} {locale === "en" ? location.listedHours.replace(" a ", " to ") : location.listedHours}
      </p>
      <p className="mt-0.5 text-xs leading-snug break-words text-muted">{t.siteNote}</p>
    </div>
  ) : (
    municipality && <p className="leading-6 break-words text-muted">{t.card.noPoint.replace("{municipality}", municipality)}</p>
  );

  const headline = [community, municipality].filter(Boolean).join(" · ");

  return (
    <div className={`${CARD} space-y-3`}>
      {replay && (
        <p className="rounded-xl border border-review-line bg-review-soft px-3 py-2 text-xs leading-snug font-semibold break-words text-review">
          {t.replayLabel.replace("{date}", longDate)}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        {headline && <p className="min-w-0 text-base leading-6 font-semibold break-words">{headline}</p>}
        <span className="shrink-0 rounded-control bg-chip px-2.5 py-1 text-xs font-medium text-muted">
          {t.zone} {zone === "zone1" ? 1 : 2}
        </span>
      </div>

      {statusText && (
        <div className={`rounded-xl border px-3 py-2.5 break-words ${statusTone}`}>
          <p className="text-[15px] leading-6 font-medium">{statusText}</p>
          {notActive && <p className="mt-0.5 text-xs leading-snug">{t.noRotation}</p>}
          {statusSource && (
            <p className="text-xs leading-snug">
              {t.source}{" "}
              <a href={statusSource.url} target="_blank" rel="noopener noreferrer" className={LINK}>
                {sourceName(statusSource.label, locale)}
              </a>
            </p>
          )}
        </div>
      )}

      {/* With the plan over, the named site is background, not something to act on today. */}
      {!notActive && siteRow}

      <div className="space-y-2">
        {callButtons}

        <div>
          <a
            href={`tel:${AAA_LINE.tel}`}
            className={`${BUTTON} rounded-control border border-action text-action hover:bg-action-soft`}
          >
            {t.callAaa} {AAA_LINE.display}
          </a>
          <p className="mt-1 text-center text-xs leading-snug break-words text-muted">
            {t.aaaCaption.replace("{source}", AAA_LINE.sourceLabel)}
          </p>
        </div>

        <DeliveryRequest response={response} locale={locale} />
        <ShareButton response={response} locale={locale} />
      </div>

      <details className="border-t border-line pt-1">
        <summary className="flex min-h-11 cursor-pointer items-center text-sm font-medium text-action">
          {t.details}
        </summary>
        <div className="space-y-3 pb-1 text-xs leading-relaxed text-muted">
          {notActive && siteRow}
          <ZoneCalendar zone={zone} nowIso={response.now} replay={replay} locale={locale} />
          {otherLocations.length > 0 && (
            <div>
              <p>{t.alsoListed}</p>
              <ul>
                {otherLocations.map((other) => (
                  <li key={other.id} className="break-words">
                    {other.name} · {other.municipality}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {replay && (
            <p className="break-words">
              {t.replayDate} {longDate}.
            </p>
          )}
          <p className="break-words">
            {t.source} {source.title} · p. {source.pages.join(", ")}
          </p>
        </div>
      </details>
    </div>
  );
}
