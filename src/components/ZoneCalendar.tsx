import { residentChat, sourceName } from "@/i18n/resident-chat";
import { zoneCalendar } from "@/lib/calendar";
import type { ChatLocale, Zone } from "@/lib/chat-contract";
import { PLAN_STATUS } from "@/lib/plan-status";

/** Calendar dates are plain YYYY-MM-DD, so every formatter reads them as UTC midnight. */
const utc = (date: string) => new Date(`${date}T00:00:00Z`);

/**
 * The rotation exactly as AAA published it (Aug 7 to Sep 30), one grid per month. Days after the
 * Sep 2 pause were published but never happened: they are struck out, never shown as a forecast.
 */
export function ZoneCalendar({
  zone,
  nowIso,
  replay,
  locale,
}: {
  zone: Zone;
  nowIso: string;
  /** True when `nowIso` is a replay date, not the real today. */
  replay: boolean;
  locale: ChatLocale;
}) {
  const days = zoneCalendar(zone, nowIso);
  if (days.length === 0) return null;

  const t = residentChat[locale];
  const tag = locale === "es" ? "es-PR" : "en-US";
  const fmt = (options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(tag, { timeZone: "UTC", ...options });
  const narrow = fmt({ weekday: "narrow" });
  const longDay = fmt({ weekday: "long", day: "numeric", month: "long" });
  const monthTitle = fmt({ month: "long", year: "numeric" });
  const months = [...new Set(days.map((d) => d.date.slice(0, 7)))];
  const september = PLAN_STATUS.sources.septemberCalendar;

  return (
    <div className="w-full max-w-xs min-w-0 text-ink">
      <p className="mb-2 text-sm font-semibold">
        {t.calTitle} · {t.zone} {zone === "zone1" ? 1 : 2}
      </p>

      {months.map((month) => {
        const monthDays = days.filter((d) => d.date.startsWith(month));
        const leadingBlanks = (utc(monthDays[0].date).getUTCDay() + 6) % 7; // Monday-first
        return (
          <div key={month} className="mb-3">
            <p className="mb-1 text-xs font-semibold text-muted first-letter:uppercase">
              {monthTitle.format(utc(monthDays[0].date))}
            </p>
            <div aria-hidden="true" className="mb-1 grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted">
              {/* 2024-01-01 was a Monday */}
              {Array.from({ length: 7 }, (_, i) => (
                <span key={i}>{narrow.format(new Date(Date.UTC(2024, 0, 1 + i)))}</span>
              ))}
            </div>
            <ol className="grid grid-cols-7 gap-1">
              {Array.from({ length: leadingBlanks }, (_, i) => (
                <li key={`blank-${i}`} aria-hidden="true" />
              ))}
              {monthDays.map((d) => {
                const on = d.state === "with_service";
                const neverRan = d.inEffect === false;
                // The real today falls after the pause: no ring on a day that never happened.
                const current = d.isToday && (replay || !neverRan);
                const tone = neverRan
                  ? "border-line bg-chip text-muted line-through opacity-70"
                  : on
                    ? "border-success-line bg-success-soft text-success"
                    : "border-danger-line bg-danger-soft text-danger";
                return (
                  <li
                    key={d.date}
                    aria-current={current ? "date" : undefined}
                    className={`relative flex h-10 flex-col items-center justify-center rounded-md border text-xs leading-none ${tone} ${
                      current ? "font-bold ring-2 ring-action" : ""
                    }`}
                  >
                    <span aria-hidden="true">{d.day}</span>
                    {/* Glyph so the state never depends on colour alone. */}
                    <span aria-hidden="true" className="mt-0.5 text-[10px]">
                      {on ? "✓" : "✕"}
                    </span>
                    {d.changesAt6am && !neverRan && (
                      <span aria-hidden="true" className="absolute top-0.5 right-0.5 h-1.5 w-1.5 rounded-full bg-action" />
                    )}
                    {d.pausedHere && (
                      <span aria-hidden="true" className="absolute top-0.5 left-0.5 h-1.5 w-1.5 rounded-full bg-review-mark" />
                    )}
                    <span className="sr-only">
                      {longDay.format(utc(d.date))}: {on ? t.calWithService : t.calWithoutService}
                      {neverRan ? `, ${t.calNotInEffect}` : ""}
                      {d.changesAt6am && !neverRan ? `, ${t.calChange}` : ""}
                      {d.pausedHere ? `, ${t.calPauseDay}` : ""}
                      {current ? `, ${replay ? t.calReplayDay : t.calToday}` : ""}
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>
        );
      })}

      <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
        <li className="flex items-center gap-1">
          <span aria-hidden="true" className="rounded border border-success-line bg-success-soft px-1 text-success">✓</span>
          {t.calWithService}
        </li>
        <li className="flex items-center gap-1">
          <span aria-hidden="true" className="rounded border border-danger-line bg-danger-soft px-1 text-danger">✕</span>
          {t.calWithoutService}
        </li>
        <li className="flex items-center gap-1">
          <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-action" />
          {t.calChange}
        </li>
        <li className="flex items-center gap-1">
          <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-review-mark" />
          {t.calPauseDay}
        </li>
        <li className="flex items-center gap-1">
          <span aria-hidden="true" className="rounded border border-line bg-chip px-1 text-muted line-through">9</span>
          {t.calNotInEffect}
        </li>
      </ul>

      <p className="mt-2 text-xs leading-snug break-words text-muted">
        {t.calNote} {t.calAugust} {t.calSeptember}{" "}
        <a
          href={september.url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-action underline underline-offset-2"
        >
          {sourceName(september.label, locale)}
        </a>
      </p>
    </div>
  );
}
