/**
 * Hardcoded stand-in for the future Claude-powered chat. Composes two sources:
 *  - the AAA Sergio Cuevas interruption plan (zone + schedule) from interruptions.ts
 *  - the demo water points from sites.ts
 * Returns a reply plus the site the map should fly to. No live availability/wait-time claims.
 */
import { lookupLocation, PLAN, scheduleLine } from "./interruptions";
import { normalize, selectSiteForMunicipality, type Site } from "./sites";

function detectNoCar(message: string): boolean {
  return /\b(no|without|don't have|dont have)\b[\s\S]{0,15}\b(car|vehicle|transport|transportation)\b/.test(
    normalize(message),
  );
}

const shortType = (site: Site): string =>
  site.type === "delivery" ? "community delivery" : "official pickup";

/** Terse, direct, line-by-line — emergency style. Lead with where to get water. */
export function assist(message: string): { reply: string; focusSiteId: string | null } {
  const location = lookupLocation(message);
  if (!location) {
    return { reply: "Where are you? e.g. Isla Verde, Río Piedras, Carolina", focusSiteId: null };
  }

  const noCar = detectNoCar(message);
  const selection = selectSiteForMunicipality(location.municipality, noCar);
  const lines: string[] = [];

  if (selection) {
    lines.push(`🚰 ${selection.site.name} — ${shortType(selection.site)}`);
    if (selection.alternative) lines.push(`↔ Alt: ${selection.alternative.name} (official)`);
  }

  if (location.sector) {
    lines.push(`📍 ${location.sector.name} — Zone ${location.sector.zone}`);
  } else {
    lines.push(`📍 ${location.label} — zone depends on your sector`);
  }

  if (!selection) lines.push("⚠ No listed water point here yet");

  lines.push(`⏱ ${scheduleLine()}`);
  lines.push(`📞 ${PLAN.phones}`);

  return { reply: lines.join("\n"), focusSiteId: selection ? selection.site.id : null };
}
