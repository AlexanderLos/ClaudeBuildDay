/**
 * Hardcoded demo water-resource data for the resident (user) page.
 * Coordinates are illustrative demo points from designs/agua-vecina/agua-map.js — not surveyed,
 * not live. No hours/inventory/wait-time claims: those aren't known here.
 * This stands in for real published data until the admin flow + Claude extraction exist.
 */

export type SiteType = "official" | "delivery";

export type Site = {
  id: string;
  name: string;
  type: SiteType;
  municipality: string;
  lat: number;
  lng: number;
  /** The single best demo option. */
  recommended?: boolean;
  note: string;
};

export const SITES: Site[] = [
  {
    id: "villa",
    name: "Villa Carolina",
    type: "delivery",
    municipality: "Carolina",
    lat: 18.418,
    lng: -65.978,
    recommended: true,
    note: "Community coordination. Exact location is confirmed when arranging.",
  },
  {
    id: "escorial",
    name: "Pozo Escorial",
    type: "official",
    municipality: "Carolina",
    lat: 18.392,
    lng: -65.962,
    note: "Point listed in an official notice (demo).",
  },
  {
    id: "julia",
    name: "Julia de Burgos Park cistern",
    type: "official",
    municipality: "Carolina",
    lat: 18.372,
    lng: -65.985,
    note: "Point listed in an official notice (demo).",
  },
  {
    id: "islaverde",
    name: "Isla Verde water truck",
    type: "official",
    municipality: "Carolina",
    lat: 18.443,
    lng: -66.018,
    note: "Point listed in an official notice (demo).",
  },
  {
    id: "sabana",
    name: "Sabana Gardens route",
    type: "delivery",
    municipality: "Carolina",
    lat: 18.425,
    lng: -66.045,
    note: "Community coordination. Exact location is confirmed when arranging.",
  },
  {
    id: "riopiedras",
    name: "Río Piedras Plaza oasis",
    type: "official",
    municipality: "San Juan",
    lat: 18.4,
    lng: -66.05,
    note: "Point listed in an official notice (demo).",
  },
];

export function siteColor(site: Site): string {
  if (site.recommended) return "#1F8A5B";
  return site.type === "official" ? "#1A86C6" : "#6B4FBB";
}

export function typeLabel(site: Site): string {
  if (site.recommended) return "Recommended option";
  return site.type === "official" ? "Verified official pickup" : "Community delivery";
}

export function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

/**
 * Pick a water point in a municipality: community delivery when the resident has no car,
 * otherwise an official pickup, plus an official alternative. Null when we have no site there.
 */
export function selectSiteForMunicipality(
  municipality: string,
  noCar: boolean,
): { site: Site; alternative: Site | null } | null {
  const inMunicipality = SITES.filter((s) => s.municipality === municipality);
  if (inMunicipality.length === 0) return null;

  const site = noCar
    ? inMunicipality.find((s) => s.recommended) ??
      inMunicipality.find((s) => s.type === "delivery") ??
      inMunicipality[0]
    : inMunicipality.find((s) => s.type === "official") ?? inMunicipality[0];

  const alternative = inMunicipality.find((s) => s.id !== site.id && s.type === "official") ?? null;
  return { site, alternative };
}
