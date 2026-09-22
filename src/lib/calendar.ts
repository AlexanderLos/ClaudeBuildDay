import { calendarSourceFor, data } from "@/lib/source-data";
import { PLAN_STATUS } from "@/lib/plan-status";
import type { ServiceState, Zone } from "@/lib/chat-contract";

export type CalendarDay = {
  date: string; // YYYY-MM-DD (Puerto Rico calendar date)
  day: number;
  weekday: string; // es short
  /** What the calendar PUBLISHED for this day. Only real when `inEffect`. */
  state: ServiceState;
  changesAt6am: boolean;
  isToday: boolean;
  /** False from the pause day (Sep 2, 2026) on: published, but the rotation never ran. */
  inEffect: boolean;
  /** True only on the day the plan was paused. */
  pausedHere: boolean;
  /** "notice" = the AAA notice (p. 16, through Aug 31); "september" = the calendar AAA published Aug 31. */
  source: "notice" | "september";
};

const WEEKDAYS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const DAY_MS = 86_400_000;
const PR_OFFSET_MS = 4 * 3_600_000; // Puerto Rico is fixed -04:00, no DST
const PAUSE_DATE = PLAN_STATUS.pausedAt.slice(0, 10);

/** One entry per published day, Aug 7 → Sep 30. Each day is labeled by the state published from 6:00 a.m. Never extrapolates. */
export function zoneCalendar(zone: Zone, nowIso: string): CalendarDay[] {
  const { transitions, calendarPublishedThrough } = data.schedule.phase1;
  const today = new Date(Date.parse(nowIso) - PR_OFFSET_MS).toISOString().slice(0, 10);
  const days: CalendarDay[] = [];

  for (
    let t = Date.parse(`${transitions[0].at.slice(0, 10)}T00:00:00Z`);
    new Date(t).toISOString().slice(0, 10) <= calendarPublishedThrough;
    t += DAY_MS
  ) {
    const utc = new Date(t);
    const date = utc.toISOString().slice(0, 10);
    const sixAm = Date.parse(`${date}T06:00:00-04:00`);
    const current = transitions.findLast((tr) => Date.parse(tr.at) <= sixAm);
    if (!current) continue;
    days.push({
      date,
      day: utc.getUTCDate(),
      weekday: WEEKDAYS[utc.getUTCDay()],
      state: current[zone] as ServiceState,
      changesAt6am: Date.parse(current.at) === sixAm,
      isToday: date === today,
      inEffect: date < PAUSE_DATE,
      pausedHere: date === PAUSE_DATE,
      source: calendarSourceFor(date),
    });
  }
  return days;
}
