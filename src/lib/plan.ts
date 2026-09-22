/**
 * Source-of-truth lookups over `src/data/agua-vecina-source-data.json`.
 * Pure, synchronous, safe on client and server. Nothing here is invented: every returned fact
 * comes from the JSON. Support locations carry no coordinates: the notice gives none and we guess none.
 */
import { data } from "@/lib/source-data";
import { normalizePlaceText } from "@/lib/curated-coordinates";
import { PLAN_STATUS } from "@/lib/plan-status";
import type {
  OmmeContact,
  ServiceState,
  ServiceStatus,
  SupportLocation,
  Zone,
  ZoneLookup,
  ZoneMatch,
} from "@/lib/chat-contract";

export const PLAN_PDF_PATH = "/aaa-sergio-cuevas-plan.pdf";
export const SOURCE_TITLE: string = data.source.documentTitle;
export const MUNICIPALITIES: string[] = data.notice.affectedMunicipalities;
export const PREFERRED_PHRASES = data.chatbotRules.preferredPhrases;
export const RESIDENT_GUIDANCE = data.residentGuidance;

/** End of the published Phase 1 calendar (notice + September): the first instant that is outside it. */
const CALENDAR_ENDS_AT =
  new Date(`${data.schedule.phase1.calendarPublishedThrough}T00:00:00-04:00`).getTime() + 86_400_000;

const PREFIX_RE =
  /^(urb|bo|barrio|sector|bda|res|residencial|cond|condominio|ext|ave|calle|pueblo de)\s+/;

/** Road segments ("Carr. 857, Km 5.1...", "PR-185...") are not something a resident types. */
function isRoadSegment(name: string): boolean {
  return /^(Carr\.|PR-)/.test(name);
}

/** Official name reduced to what a resident types: "Bo. Barrazas" and "Barrazas" share a key. */
export function communityKey(community: string): string {
  return normalizePlaceText(community.replace(/,\s*Km\b.*$/, "")).replace(PREFIX_RE, "");
}

type Entry = ZoneMatch & { key: string };

const ENTRIES: Entry[] = (() => {
  const out: Entry[] = [];
  const seen = new Set<string>();
  for (const area of data.affectedAreas) {
    for (const community of area.communities) {
      if (isRoadSegment(community)) continue;
      // "Cuesta Los Flacos, Km 1" is a named place: match it without the Km marker, keep the official name.
      const full = normalizePlaceText(community.replace(/,\s*Km\b.*$/, ""));
      const stripped = full.replace(PREFIX_RE, "");
      for (const key of new Set([full, stripped])) {
        if (!key) continue;
        const dedupe = `${key}|${area.municipality}|${community}|${area.zone}`;
        if (seen.has(dedupe)) continue;
        seen.add(dedupe);
        out.push({
          key,
          municipality: area.municipality,
          community,
          zone: area.zone as Zone,
          sourcePage: area.sourcePage,
        });
      }
    }
  }
  return out.sort((a, b) => b.key.length - a.key.length);
})();

/** Every matchable community (same set `lookupZone` searches: road segments excluded), official names, A→Z. */
export function allCommunities(): { community: string; municipality: string; zone: Zone }[] {
  const seen = new Set<string>();
  const out: { community: string; municipality: string; zone: Zone }[] = [];
  for (const { community, municipality, zone } of ENTRIES) {
    const id = `${municipality}|${community}|${zone}`;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push({ community, municipality, zone });
  }
  return out.sort(
    (a, b) => a.community.localeCompare(b.community, "es") || a.municipality.localeCompare(b.municipality, "es"),
  );
}

/**
 * Communities named in free text. Accent/case-insensitive, whole-word. A shorter name contained
 * inside a longer one at the same position loses ("Loíza Valley" is not the Loíza municipality).
 */
export function lookupZone(text: string): ZoneLookup {
  const padded = ` ${normalizePlaceText(text)} `;
  const hits: { entry: Entry; start: number; end: number }[] = [];
  for (const entry of ENTRIES) {
    const start = padded.indexOf(` ${entry.key} `);
    if (start < 0) continue;
    hits.push({ entry, start, end: start + entry.key.length + 2 });
  }

  const kept = hits.filter(
    (h) =>
      !hits.some(
        (other) =>
          other !== h &&
          other.entry.key.length > h.entry.key.length &&
          other.start <= h.start &&
          other.end >= h.end,
      ),
  );

  // "Country Club" also fits "Country Club 29" (other zone); "Montebello" fits "Complejos
  // Montebello". A longer official name in a DIFFERENT zone that contains what was typed is a
  // candidate too, so the caller asks instead of guessing.
  const candidates = kept.map((h) => h.entry);
  for (const { entry } of kept) {
    for (const other of ENTRIES) {
      if (other.zone !== entry.zone && other.key !== entry.key && ` ${other.key} `.includes(` ${entry.key} `)) {
        candidates.push(other);
      }
    }
  }

  const matches: ZoneMatch[] = [];
  const seen = new Set<string>();
  for (const entry of candidates) {
    const id = `${entry.municipality}|${entry.community}|${entry.zone}`;
    if (seen.has(id)) continue;
    seen.add(id);
    matches.push({
      municipality: entry.municipality,
      community: entry.community,
      zone: entry.zone,
      sourcePage: entry.sourcePage,
    });
  }

  // A municipality named on its own (not just inside a matched community name).
  const named = MUNICIPALITIES.find((m) => {
    const start = padded.indexOf(` ${normalizePlaceText(m)} `);
    if (start < 0) return false;
    const end = start + normalizePlaceText(m).length + 2;
    return !kept.some((h) => h.start <= start && h.end >= end);
  });
  const shared =
    matches.length > 0 && matches.every((m) => m.municipality === matches[0].municipality)
      ? matches[0].municipality
      : null;

  return { matches, municipality: named ?? shared ?? null };
}

/** Optimal-string-alignment distance (Levenshtein + adjacent swap); anything above `max` is just "too far". */
function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev2: number[] = [];
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i += 1) {
    const row = [i];
    for (let j = 1; j <= b.length; j += 1) {
      let v = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, prev2[j - 2] + 1);
      row.push(v);
    }
    prev2 = prev;
    prev = row;
  }
  return prev[b.length];
}

const CONNECTORS = new Set(["de", "del", "la", "las", "los", "el", "y"]);

/**
 * Near-misses for a typo ("vila carolina", "condao"), closest first, max 3. Only for ASKING
 * "did you mean…?", never for answering. Every word of the name must be typed (1 slip allowed in
 * a 5–7 letter word, 2 in a longer one); one-word names need 6+ letters.
 * ponytail: O(names × words) per call, ~300 names; index by first letter if the notice grows.
 */
export function fuzzyCommunities(text: string): ZoneMatch[] {
  const words = normalizePlaceText(text).split(" ").filter(Boolean);
  const scored: { entry: Entry; distance: number }[] = [];
  const seen = new Set<string>();
  for (const entry of ENTRIES) {
    const id = `${entry.municipality}|${entry.community}|${entry.zone}`;
    if (seen.has(id) || entry.key !== communityKey(entry.community)) continue;
    const tokens = entry.key.split(" ").filter((token) => !CONNECTORS.has(token));
    if (tokens.length === 0 || (tokens.length === 1 && tokens[0].length < 6)) continue;
    let distance = 0;
    const ok = tokens.every((token) => {
      const max = token.length >= 8 ? 2 : token.length >= 5 ? 1 : 0;
      const best = Math.min(...words.map((word) => (word === token ? 0 : editDistance(word, token, max))), max + 1);
      distance += best;
      return best <= max;
    });
    if (!ok) continue;
    seen.add(id);
    scored.push({ entry, distance });
  }
  const closest = Math.min(...scored.map((s) => s.distance));
  return scored
    .filter((s) => s.distance === closest)
    .slice(0, 3)
    .map(({ entry: { municipality, community, zone, sourcePage } }) => ({ municipality, community, zone, sourcePage }));
}

const PAUSED_AT = Date.parse(PLAN_STATUS.pausedAt);
/** Start of the day (Puerto Rico) the end of the plan was reported. */
const ENDED_AT = Date.parse(`${PLAN_STATUS.endedReportedOn}T00:00:00-04:00`);

/**
 * Service state for a zone at `now`. From the pause on there is no rotation, whatever the calendar
 * had published; before it, straight off the published Phase 1 calendar. No extrapolation.
 */
export function serviceStatus(zone: Zone, now: Date): ServiceStatus {
  const phase1 = data.schedule.phase1;
  const transitions = phase1.transitions.map((t) => ({
    at: t.at,
    time: new Date(t.at).getTime(),
    state: t[zone] as ServiceState,
  }));
  const t = now.getTime();

  if (t >= PAUSED_AT) {
    const ended = t >= ENDED_AT;
    return {
      kind: "plan_not_active",
      zone,
      phase: ended ? "ended" : "paused",
      pausedAt: PLAN_STATUS.pausedAt,
      endedReportedOn: ended ? PLAN_STATUS.endedReportedOn : null,
    };
  }

  if (t < transitions[0].time || t >= CALENDAR_ENDS_AT) {
    return { kind: "outside_calendar", zone, calendarPublishedThrough: phase1.calendarPublishedThrough };
  }

  let index = 0;
  for (let i = 0; i < transitions.length; i += 1) {
    if (transitions[i].time <= t) index = i;
  }
  const next = transitions[index + 1] ?? null;
  return {
    kind: "in_calendar",
    zone,
    state: transitions[index].state,
    since: transitions[index].at,
    nextChangeAt: next?.at ?? null,
    nextState: next?.state ?? null,
    sourcePages: phase1.sourcePages,
  };
}

function toSupportLocation(loc: (typeof data.officialWaterSupportLocations)[number]): SupportLocation {
  return {
    id: loc.id,
    name: loc.name,
    municipality: loc.municipality,
    listedHours: loc.listedHours,
    sourcePage: loc.sourcePage,
    // AAA never published where these sites are: no coordinate is guessed for any of them.
    coordinates: null,
  };
}

/** Mappable ones first, so a caller can recommend a point it can actually show. */
function byCoordinatesFirst(a: SupportLocation, b: SupportLocation): number {
  return Number(Boolean(b.coordinates)) - Number(Boolean(a.coordinates));
}

export function listSupportLocations(municipality: string): SupportLocation[] {
  const target = normalizePlaceText(municipality);
  return data.officialWaterSupportLocations
    .filter((loc) => normalizePlaceText(loc.municipality) === target)
    .map(toSupportLocation)
    .sort(byCoordinatesFirst);
}

export function allSupportLocations(): SupportLocation[] {
  return data.officialWaterSupportLocations.map(toSupportLocation).sort(byCoordinatesFirst);
}

export function ommeContact(municipality: string): OmmeContact | null {
  const target = normalizePlaceText(municipality);
  return (
    data.emergencyManagementContacts.find((c) => normalizePlaceText(c.municipality) === target) ??
    null
  );
}
