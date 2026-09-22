/**
 * Shared contract for the resident chat: the lookup functions in `plan.ts`, the `/api/chat`
 * route, and the resident UI all code against these types. Types and constants only.
 * Every fact comes from `src/data/agua-vecina-source-data.json`; nothing here is invented.
 */

export type Zone = "zone1" | "zone2";
export type ServiceState = "with_service" | "without_service";

/**
 * Replay mode: the rationing plan ended, so "today" has no rotation to show. Replay answers as of
 * noon (Puerto Rico) on a day while the published calendar was actually in effect. Never today.
 */
export const REPLAY_MIN = "2026-08-07";
export const REPLAY_MAX = "2026-09-01";
export const REPLAY_DEFAULT = "2026-08-14";
/** Noon in Puerto Rico on REPLAY_DEFAULT. Kept for callers that only need the default instant. */
export const DEMO_NOW_ISO = "2026-08-14T12:00:00-04:00";

/** One community from the notice's affected-area lists, with its official name preserved. */
export type ZoneMatch = {
  municipality: string;
  /** Official name exactly as the source lists it, e.g. "Urb. Villa Carolina". */
  community: string;
  zone: Zone;
  sourcePage: number;
};

export type ZoneLookup = {
  /** Every community found in the text. More than one distinct zone means "ask, don't guess". */
  matches: ZoneMatch[];
  /** Municipality named in the text or implied by the matches; null when unknown. */
  municipality: string | null;
};

export type ServiceStatus =
  | {
      kind: "in_calendar";
      zone: Zone;
      state: ServiceState;
      /** ISO instant of the transition that started the current state. */
      since: string;
      /** ISO instant of the next published transition; null when none is published. */
      nextChangeAt: string | null;
      nextState: ServiceState | null;
      sourcePages: number[];
    }
  | {
      /** `now` is after the plan was paused (Sep 2, 2026) or reported ended: there is no rotation. */
      kind: "plan_not_active";
      zone: Zone;
      phase: "paused" | "ended";
      /** ISO instant the rotation stopped. */
      pausedAt: string;
      /** YYYY-MM-DD the end was reported; null while only paused. */
      endedReportedOn: string | null;
    }
  | {
      /** `now` is before the plan starts or after the published calendar ends. No extrapolation. */
      kind: "outside_calendar";
      zone: Zone;
      calendarPublishedThrough: string;
    };

export type SupportLocation = {
  /** Source id, e.g. "pozo-escorial". Map marker ids use the same value. */
  id: string;
  name: string;
  municipality: string;
  /** Hours as listed in the notice. Never live or confirmed. */
  listedHours: string;
  sourcePage: number;
  /**
   * Always null today: AAA never published where these sites are, and the guessed pins were removed.
   * The shape stays so a verified, dated coordinate can be added later without a contract change.
   */
  coordinates: { lat: number; lng: number; kind: "curated_demo" | "curated_research" } | null;
};

export type OmmeContact = {
  municipality: string;
  agency: string;
  phones: string[];
  sourcePage: number;
};

/** Language of the UI and of the answer. */
export type ChatLocale = "es" | "en";

export type ChatRequest = {
  message: string;
  /** Current UI language; the fallback when the message language cannot be detected. Default "es". */
  locale?: ChatLocale;
  /** True = replay mode (answer as of `replayDate`). False = the real current time. */
  simulateDate: boolean;
  /** YYYY-MM-DD between REPLAY_MIN and REPLAY_MAX; only read in replay mode. Default REPLAY_DEFAULT. */
  replayDate?: string;
  /** Earlier user messages, oldest first, so a follow-up like "no tengo carro" keeps its place. */
  previousUserMessages?: string[];
};

export type ChatResponse = {
  /** Short text for the chat bubble, written in `locale`. */
  answer: string;
  /** Language the answer was written in (detected from the message, else the request locale). */
  locale: ChatLocale;
  phrasedBy: "claude" | "deterministic";
  /** ISO instant the answer is computed for. */
  now: string;
  simulated: boolean;
  /** True when no community matched or the matches span more than one zone. */
  needsClarification: boolean;
  community: string | null;
  municipality: string | null;
  zone: Zone | null;
  status: ServiceStatus | null;
  /** Recommended official support location: same municipality, curated coordinate preferred. */
  location: SupportLocation | null;
  otherLocations: SupportLocation[];
  contact: OmmeContact | null;
  /** True when the resident said they have no transportation ("no tengo carro"). */
  noTransport: boolean;
  source: { title: string; pages: number[] };
  /**
   * Optional tappable answers to a question the bot asked. Each is a FULL message in the answer's
   * language ("Estoy en Sector Piñones, Loíza"); the UI sends it as-is when tapped.
   */
  quickReplies?: string[];
};
