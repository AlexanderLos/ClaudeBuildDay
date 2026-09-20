/**
 * Curated DEMO coordinate catalogue.
 *
 * These four points come from the design export (`designs/agua-vecina/agua-map.js`). They are
 * illustrative demo values: not surveyed, not from any notice, and never produced by the model.
 * A match here is only a suggestion. It becomes a map resource only after the coordinator
 * explicitly approves it. Anything without a match stays unmappable. No geocoding, no guessing.
 */
import type { CuratedCoordinateCandidate, ExtractedResource } from "./contracts";

export const CURATED_COORDINATES: readonly CuratedCoordinateCandidate[] = [
  {
    id: "pozo-escorial",
    name: "Pozo Escorial",
    aliases: ["pozo escorial"],
    lat: 18.392,
    lng: -65.962,
    source: "design_demo",
  },
  {
    id: "parque-julia-de-burgos",
    name: "Parque Julia de Burgos",
    aliases: ["parque julia de burgos"],
    lat: 18.372,
    lng: -65.985,
    source: "design_demo",
  },
  {
    id: "plaza-rio-piedras",
    name: "Plaza de Río Piedras",
    aliases: ["plaza de rio piedras", "rio piedras plaza"],
    lat: 18.4,
    lng: -66.05,
    source: "design_demo",
  },
  {
    id: "isla-verde",
    name: "Isla Verde",
    aliases: ["isla verde"],
    lat: 18.443,
    lng: -66.018,
    source: "design_demo",
  },
];

/** Lowercase, strip diacritics and punctuation, collapse whitespace. */
export function normalizePlaceText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function getCandidateById(id: string): CuratedCoordinateCandidate | null {
  return CURATED_COORDINATES.find((candidate) => candidate.id === id) ?? null;
}

/**
 * Deterministic suggestion: the first catalogue entry (in catalogue order) with an alias that
 * appears as whole words in the resource's name or location description.
 */
export function suggestCoordinate(
  resource: Pick<ExtractedResource, "name" | "locationDescription">,
): CuratedCoordinateCandidate | null {
  const haystack = ` ${normalizePlaceText(
    `${resource.name} ${resource.locationDescription ?? ""}`,
  )} `;
  return (
    CURATED_COORDINATES.find((candidate) =>
      candidate.aliases.some((alias) => haystack.includes(` ${alias} `)),
    ) ?? null
  );
}
