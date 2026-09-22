"use client";

import Link from "next/link";
import { LanguageToggle } from "@/components/shell/LanguageToggle";
import { useLocale } from "@/i18n/LocaleProvider";
import { residentMap } from "@/i18n/resident-map";
import { REPLAY_MAX, REPLAY_MIN } from "@/lib/chat-contract";
import { PLAN_PDF_PATH } from "@/lib/plan";

const noon = (day: string) => new Date(`${day}T12:00:00-04:00`);

/** Slim top bar for the resident page: brand, replay switch + date, notice link, help, language. */
export function ResidentHeader({
  replay,
  replayDate,
  onReplayChangeAction,
  onReplayDateChangeAction,
}: {
  replay: boolean;
  replayDate: string;
  onReplayChangeAction: (on: boolean) => void;
  onReplayDateChangeAction: (date: string) => void;
}) {
  const { locale } = useLocale();
  const t = residentMap[locale];
  // "Aug 7 – Sep 1", from the contract's constants. Two format() calls joined by hand, not
  // formatRange(): Node and the browser ship different ICU range separators (thin vs normal
  // spaces), which made server and client HTML differ and broke hydration.
  const day = new Intl.DateTimeFormat(locale, {
    timeZone: "America/Puerto_Rico",
    month: "short",
    day: "numeric",
  });
  const range = `${day.format(noon(REPLAY_MIN))} – ${day.format(noon(REPLAY_MAX))}`;

  return (
    <header className="flex min-h-14 shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-line bg-surface px-4 py-1.5">
      <div className="flex items-baseline gap-3">
        <span className="font-serif text-xl text-ink">{t.brand}</span>
        <span className="hidden text-sm text-muted xl:inline">{t.tagline}</span>
        {/* Phones: the controls row has no room for the notice link, so it sits beside the brand. */}
        <a
          href={PLAN_PDF_PATH}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-11 items-center text-sm font-medium text-action hover:underline sm:hidden"
        >
          {t.noticeLink}
        </a>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={replay}
          title={t.replayHint}
          onClick={() => onReplayChangeAction(!replay)}
          className="inline-flex min-h-11 items-center gap-2 rounded-control border border-review-line bg-review-soft px-3 text-sm font-medium whitespace-nowrap text-review"
        >
          <span
            aria-hidden="true"
            className={`flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors ${
              replay ? "bg-review" : "bg-line-field"
            }`}
          >
            <span className={`size-4 rounded-full bg-surface transition-transform ${replay ? "translate-x-4" : ""}`} />
          </span>
          {t.replay(range)}
          <span className="sr-only">. {t.replayHint}</span>
        </button>

        {replay && (
          <input
            type="date"
            aria-label={t.replayDateLabel}
            min={REPLAY_MIN}
            max={REPLAY_MAX}
            value={replayDate}
            // A cleared or hand-typed out-of-range date is ignored: replay never leaves the published calendar.
            onChange={(e) => {
              const day = e.target.value;
              if (day >= REPLAY_MIN && day <= REPLAY_MAX) onReplayDateChangeAction(day);
            }}
            className="min-h-11 rounded-control border border-line-field bg-surface px-3 text-sm text-ink"
          />
        )}

        <a
          href={PLAN_PDF_PATH}
          target="_blank"
          rel="noreferrer"
          className="hidden min-h-11 items-center text-sm font-medium text-action hover:underline sm:inline-flex"
        >
          {t.noticeLink}
        </a>

        <Link
          href="/help"
          className="inline-flex min-h-11 items-center text-sm font-medium text-action hover:underline"
        >
          {t.helpLink}
        </Link>
        <Link
          href="/volunteer"
          className="inline-flex min-h-11 items-center text-sm font-medium text-action hover:underline"
        >
          {t.volunteerLink}
        </Link>

        <LanguageToggle />
      </div>
    </header>
  );
}
