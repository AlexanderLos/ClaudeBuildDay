/**
 * DEMO sample notice. Invented for demonstration and tests; it does not come from any real
 * document. It is only reachable through the explicit "Load sample notice" control (when
 * NEXT_PUBLIC_ENABLE_DEMO_FALLBACK is "true") and is always labelled "Demo data" in the UI.
 * It is never substituted for a failed AI extraction.
 *
 * It deliberately states no addresses, no hours, and no availability, and it includes one
 * location with no curated coordinates so the "requires confirmation" path is visible.
 */
import type { ExtractedNotice } from "./contracts";

const DEMO_QUOTE = "Texto de muestra (datos de demostración).";

export const SAMPLE_NOTICE: ExtractedNotice = {
  title: {
    value: "Aviso de muestra: interrupción programada (datos de demostración)",
    evidence: { page: 1, quote: DEMO_QUOTE },
    confidence: "high",
    reviewStatus: "matched",
    edited: false,
  },
  issuingOrganization: {
    value: "Organización de muestra (demostración)",
    evidence: { page: 1, quote: DEMO_QUOTE },
    confidence: "high",
    reviewStatus: "matched",
    edited: false,
  },
  publicationDate: {
    value: null,
    evidence: { page: null, quote: "" },
    confidence: "low",
    reviewStatus: "needs_review",
    edited: false,
  },
  affectedAreas: [
    {
      id: "area-0",
      zone: "Zona 1",
      municipality: "Carolina",
      communities: ["Comunidad de muestra A", "Comunidad de muestra B"],
      evidence: { page: 2, quote: DEMO_QUOTE },
      confidence: "high",
      reviewStatus: "matched",
      edited: false,
    },
    {
      id: "area-1",
      zone: "Zona 2",
      municipality: "San Juan",
      communities: ["Comunidad de muestra C"],
      evidence: { page: 2, quote: DEMO_QUOTE },
      confidence: "medium",
      reviewStatus: "needs_review",
      edited: false,
    },
  ],
  interruptionWindows: [
    {
      id: "window-0",
      zone: "Zona 1",
      start: null,
      end: null,
      description: "Ventana de muestra: el aviso de demostración no indica fechas.",
      evidence: { page: null, quote: "" },
      confidence: "low",
      reviewStatus: "needs_review",
      edited: false,
    },
  ],
  resources: [
    {
      id: "resource-0",
      name: "Pozo Escorial",
      locationDescription: "Carolina",
      hours: null,
      evidence: { page: 3, quote: DEMO_QUOTE },
      confidence: "high",
      reviewStatus: "matched",
      edited: false,
    },
    {
      id: "resource-1",
      name: "Parque Julia de Burgos",
      locationDescription: "Carolina",
      hours: null,
      evidence: { page: 3, quote: DEMO_QUOTE },
      confidence: "medium",
      reviewStatus: "needs_review",
      edited: false,
    },
    {
      id: "resource-2",
      name: "Punto de muestra sin coordenadas",
      locationDescription: null,
      hours: null,
      evidence: { page: 3, quote: DEMO_QUOTE },
      confidence: "high",
      reviewStatus: "matched",
      edited: false,
    },
  ],
  residentInstructions: [
    {
      id: "instruction-0",
      text: "Instrucción de muestra: lleve sus propios envases.",
      evidence: { page: 3, quote: DEMO_QUOTE },
      confidence: "high",
      reviewStatus: "matched",
      edited: false,
    },
  ],
};
