"use client";

import { ReservoirChip } from "@/components/ReservoirChip";
import { useLocale } from "@/i18n/LocaleProvider";
import { residentMap } from "@/i18n/resident-map";
import { AAA_LINE } from "@/lib/contacts";
import { PLAN_STATUS } from "@/lib/plan-status";

// Every date is noon in Puerto Rico, formatted in Puerto Rico: no browser time zone can shift the day.
const TIME_ZONE = "America/Puerto_Rico";
const noon = (day: string) => new Date(`${day}T12:00:00-04:00`);

/** The honest status of the plan, directly under the header: what is true today, or that this is a replay. */
export function StatusBanner({
  replay,
  replayDate,
  onExitReplayAction,
}: {
  replay: boolean;
  replayDate: string;
  onExitReplayAction: () => void;
}) {
  const { locale } = useLocale();
  const t = residentMap[locale];
  const format = (date: Date, options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(locale, { timeZone: TIME_ZONE, ...options }).format(date);
  const short: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" };

  if (replay) {
    return (
      <div
        role="status"
        className="flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-review-line bg-review-soft px-4 py-1.5 text-xs leading-snug text-review sm:text-sm"
      >
        <p className="min-w-0 flex-1 basis-64">
          <strong className="font-semibold">{t.bannerReplay}</strong> —{" "}
          {t.bannerReplayDetail(format(noon(replayDate), { dateStyle: "long" }))}
        </p>
        <button
          type="button"
          onClick={onExitReplayAction}
          className="inline-flex min-h-11 shrink-0 items-center rounded-control border border-review-line bg-surface px-4 text-sm font-semibold whitespace-nowrap text-review hover:bg-review-soft"
        >
          {t.exitReplay}
        </button>
      </div>
    );
  }

  return (
    <div
      role="status"
      className="flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-success-line bg-success-soft px-4 py-2 text-xs leading-snug text-ink sm:text-sm"
    >
      <p className="min-w-0 flex-1 basis-64">
        <strong className="font-semibold text-success">{t.bannerEnded}</strong> —{" "}
        {t.bannerEndedDetail(
          format(noon(PLAN_STATUS.endedReportedOn), short),
          format(new Date(PLAN_STATUS.pausedAt), { month: "short", day: "numeric" }),
        )}{" "}
        <a href={`tel:${AAA_LINE.tel}`} className="font-semibold whitespace-nowrap text-action underline">
          {AAA_LINE.display}
        </a>
        .{" "}
        <span className="text-muted">
          {t.lastVerified(format(noon(PLAN_STATUS.lastVerified), short))} ·{" "}
          <a
            href={PLAN_STATUS.sources.ended.url}
            target="_blank"
            rel="noopener noreferrer"
            title={PLAN_STATUS.sources.ended.label}
            className="font-medium text-action underline"
          >
            {t.source}
          </a>
        </span>
      </p>
      <ReservoirChip />
    </div>
  );
}
