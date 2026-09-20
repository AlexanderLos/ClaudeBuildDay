/**
 * AAA (AcueductosPR) scheduled-interruption plan — Sergio Cuevas Bustamante filtration plant
 * (Trujillo Alto). Extracted from the official notice PDF (see /aaa-sergio-cuevas-plan.pdf).
 *
 * This is real notice content, layered on top of the hardcoded demo water points. The sector→zone
 * list below is a representative subset of the notice's much longer lists — enough to demo zone
 * lookup. It is NOT the complete sector inventory.
 */
import { normalize } from "./sites";

export const PLAN = {
  plant: "Sergio Cuevas Bustamante Filtration Plant (Trujillo Alto)",
  startedOn: "August 7, 2026, 6:00 A.M.",
  municipalities: ["San Juan", "Trujillo Alto", "Carolina", "Loíza", "Canóvanas", "Gurabo", "Juncos"],
  phones: "787-620-2482",
  source: "acueductos.pr.gov",
  /** Public copy of the notice served from /public. */
  pdfPath: "/aaa-sergio-cuevas-plan.pdf",
};

/** One terse line describing how service alternates. Truthful to the notice, no live claims. */
export function scheduleLine(): string {
  return "2 days on / 2 off (Ph.1); 1 on / 3 off (Ph.2)";
}

type SectorZone = { key: string; name: string; municipality: string; zone: 1 | 2 };

/** Representative sector → zone mappings from the notice (subset). Matched longest-key-first. */
const SECTOR_ZONES: SectorZone[] = [
  // Zone 1 (began WITH service)
  { key: "isla verde", name: "Isla Verde", municipality: "Carolina", zone: 1 },
  { key: "villa carolina", name: "Villa Carolina", municipality: "Carolina", zone: 1 },
  { key: "sabana gardens", name: "Sabana Gardens", municipality: "Carolina", zone: 1 },
  { key: "villa fontana", name: "Villa Fontana", municipality: "Carolina", zone: 1 },
  { key: "condado", name: "Condado", municipality: "San Juan", zone: 1 },
  { key: "miramar", name: "Miramar", municipality: "San Juan", zone: 1 },
  { key: "viejo san juan", name: "Viejo San Juan", municipality: "San Juan", zone: 1 },
  { key: "ocean park", name: "Ocean Park", municipality: "San Juan", zone: 1 },
  { key: "round hill", name: "Round Hill", municipality: "Trujillo Alto", zone: 1 },
  { key: "ciudad universitaria", name: "Ciudad Universitaria", municipality: "Trujillo Alto", zone: 1 },
  { key: "pinones", name: "Piñones", municipality: "Loíza", zone: 1 },
  { key: "los castillos", name: "Los Castillos", municipality: "Canóvanas", zone: 1 },
  { key: "las pinas", name: "Sector Las Piñas", municipality: "Juncos", zone: 1 },
  // Zone 2 (began WITHOUT service)
  { key: "metropolis", name: "Metrópolis", municipality: "Carolina", zone: 2 },
  { key: "parque escorial", name: "Parque Escorial", municipality: "Carolina", zone: 2 },
  { key: "escorial plaza", name: "Escorial Plaza", municipality: "Carolina", zone: 2 },
  { key: "club yaucano", name: "Club Yaucano", municipality: "Carolina", zone: 2 },
  { key: "carolina alta", name: "Carolina Alta", municipality: "Carolina", zone: 2 },
  { key: "rio piedras", name: "Río Piedras", municipality: "San Juan", zone: 2 },
  { key: "buen consejo", name: "Buen Consejo", municipality: "San Juan", zone: 2 },
  { key: "villa palmera", name: "Villa Palmera", municipality: "San Juan", zone: 2 },
  { key: "65 de infanteria", name: "65 de Infantería", municipality: "San Juan", zone: 2 },
  { key: "pueblo de trujillo alto", name: "Pueblo de Trujillo Alto", municipality: "Trujillo Alto", zone: 2 },
  { key: "dos bocas", name: "Dos Bocas", municipality: "Trujillo Alto", zone: 2 },
  { key: "cambalache", name: "Cambalache", municipality: "Canóvanas", zone: 2 },
  { key: "hipodromo camarero", name: "Hipódromo Camarero", municipality: "Canóvanas", zone: 2 },
  { key: "santa rita", name: "Santa Rita", municipality: "Gurabo", zone: 2 },
];

/** Municipality aliases so a bare town (or common area) is recognized as being in the plan. */
const MUNICIPALITY_ALIASES: { key: string; municipality: string; label: string }[] = [
  { key: "trujillo alto", municipality: "Trujillo Alto", label: "Trujillo Alto" },
  { key: "san juan", municipality: "San Juan", label: "San Juan" },
  { key: "canovanas", municipality: "Canóvanas", label: "Canóvanas" },
  { key: "carolina", municipality: "Carolina", label: "Carolina" },
  { key: "loiza", municipality: "Loíza", label: "Loíza" },
  { key: "gurabo", municipality: "Gurabo", label: "Gurabo" },
  { key: "juncos", municipality: "Juncos", label: "Juncos" },
];

export type LocationMatch = {
  municipality: string;
  label: string;
  /** Present only when a specific sector is recognized, giving a definite zone. */
  sector?: { name: string; zone: 1 | 2 };
};

/** Recognize a sector (→ zone) or at least a served municipality in free text. */
export function lookupLocation(message: string): LocationMatch | null {
  const text = normalize(message);

  const sector = [...SECTOR_ZONES]
    .sort((a, b) => b.key.length - a.key.length)
    .find((s) => text.includes(s.key));
  if (sector) {
    return {
      municipality: sector.municipality,
      label: sector.municipality,
      sector: { name: sector.name, zone: sector.zone },
    };
  }

  const municipality = [...MUNICIPALITY_ALIASES]
    .sort((a, b) => b.key.length - a.key.length)
    .find((m) => text.includes(m.key));
  if (municipality) {
    return { municipality: municipality.municipality, label: municipality.label };
  }

  return null;
}
