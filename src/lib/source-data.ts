/**
 * The dataset the resident app runs on: the notice's real dates, nothing shifted.
 *
 * `src/data/agua-vecina-source-data.json` is the untouched extraction of the 18-page AAA notice
 * (Phase 1 calendar Aug 7–31, 2026, p. 16). AAA published the September calendar separately on
 * Aug 31 (`src/data/september-calendar.json`, NOT in the PDF). `data` is a COPY of the notice with
 * the September transitions appended; neither JSON file is ever mutated. Whether any of it is
 * still in effect is a different question: see `plan-status.ts`.
 */
import raw from "@/data/agua-vecina-source-data.json";
import september from "@/data/september-calendar.json";

/** Last calendar day (Puerto Rico) published in the notice itself. Later days come from September's file. */
const NOTICE_CALENDAR_THROUGH = raw.schedule.phase1.calendarPublishedThrough;

export const data: typeof raw = {
  ...raw,
  schedule: {
    ...raw.schedule,
    phase1: {
      ...raw.schedule.phase1,
      calendarPublishedThrough: september.calendarPublishedThrough,
      transitions: [...raw.schedule.phase1.transitions, ...september.transitions],
    },
  },
};

/** Where the September calendar was published; cite this, never a notice page, for September dates. */
export const SEPTEMBER_SOURCE = september.source;

/** Which publication a date comes from: the notice (p. 16) through Aug 31, the September calendar after. */
export function calendarSourceFor(isoInstant: string): "notice" | "september" {
  // A bare YYYY-MM-DD is already a Puerto Rico calendar date; an instant is converted (-04:00, no DST).
  const prDate =
    isoInstant.length === 10 ? isoInstant : new Date(Date.parse(isoInstant) - 4 * 3_600_000).toISOString().slice(0, 10);
  return prDate <= NOTICE_CALENDAR_THROUGH ? "notice" : "september";
}
