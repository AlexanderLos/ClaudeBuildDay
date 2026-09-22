/**
 * Carraízo (Lago Loíza) live level: USGS station 50059000. Pure helpers, client-safe.
 *
 * Datum: AAA publishes Carraízo in metres above local mean sea level. USGS parameter 72376 is the
 * same quantity ("Lake or reservoir elevation above LMSL, meters"); 72375 is it in feet. Checked
 * 2026-09-21: USGS 40.77 m vs AAA's daily chart 40.79 m. The PRVD02 series (72379/72380) sits
 * ~0.37 m lower and is NOT comparable to AAA's scale, so it is never used here.
 */
export const USGS_FEED_URL =
  "https://api.waterdata.usgs.gov/ogcapi/v0/collections/latest-continuous/items?f=json&monitoring_location_id=USGS-50059000&limit=100";
export const USGS_PAGE_URL = "https://waterdata.usgs.gov/monitoring-location/USGS-50059000/";
/** Where the bands below were read (the daily "Niveles de embalses" chart), 2026-09-21. */
export const AAA_BANDS_URL = "https://www.acueductos.pr.gov/infraestructura/niveles-de-los-embalses";

export type ReservoirReading = {
  /** Metres above LMSL (AAA-comparable), or null when only a non-comparable unit came back. */
  levelM: number | null;
  raw: { value: number; unit: string };
  /** ISO timestamp of the USGS observation. */
  observedAt: string;
  /** AAA's own band name (Spanish), or null. A band never by itself means rationing is on or off. */
  band: string | null;
  sourceUrl: string;
};

export type ReservoirResponse = ({ ok: true } & ReservoirReading) | { ok: false };

/** AAA's Carraízo alert bands: lower bound in metres, highest first. */
const BANDS = [
  { min: 40.95, es: "Desborde", en: "overflow" },
  { min: 39.7, es: "Seguridad", en: "safe" },
  { min: 38.5, es: "Observación", en: "observation" },
  { min: 37, es: "Ajustes operacionales", en: "operational adjustments" },
  { min: 30, es: "Control", en: "control" },
  { min: -Infinity, es: "Fuera de servicio", en: "out of service" },
] as const;

export function bandFor(levelM: number): string {
  return BANDS.find((band) => levelM >= band.min)!.es;
}

/** English gloss of an AAA band name, for the tooltip. */
export function bandGloss(band: string): string {
  return BANDS.find((b) => b.es === band)?.en ?? band;
}

/** USGS `latest-continuous` FeatureCollection → reading; null when no usable LMSL elevation. */
export function parseUsgsFeed(json: unknown): ReservoirReading | null {
  const features = (json as { features?: { properties?: Record<string, unknown> }[] } | null)?.features;
  if (!Array.isArray(features)) return null;
  const find = (code: string) => features.find((f) => f?.properties?.parameter_code === code)?.properties;
  const props = find("72376") ?? find("72375");
  if (!props) return null;
  const value = Number(props.value);
  const unit = String(props.unit_of_measure);
  const observedAt = String(props.time);
  if (!Number.isFinite(value) || Number.isNaN(Date.parse(observedAt))) return null;
  const metres = unit === "m" ? value : unit === "ft" ? value * 0.3048 : null;
  // A reading outside any plausible Carraízo elevation is a feed glitch, not a level.
  if (metres === null || metres < 20 || metres > 45) return null;
  const levelM = Math.round(metres * 100) / 100;
  return { levelM, raw: { value, unit }, observedAt, band: bandFor(levelM), sourceUrl: USGS_PAGE_URL };
}

/** "40.77 m": dot decimal in both locales, on purpose. */
export function formatLevel(reading: ReservoirReading): string {
  return reading.levelM === null
    ? `${reading.raw.value} ${reading.raw.unit}`
    : `${reading.levelM.toFixed(2)} m`;
}

/** "Sep 21, 12:45 PM" in Puerto Rico time. */
export function formatObservedAt(iso: string, locale: "es" | "en"): string {
  return new Intl.DateTimeFormat(locale === "es" ? "es-PR" : "en-US", {
    timeZone: "America/Puerto_Rico",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}
