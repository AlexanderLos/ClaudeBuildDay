import { describe, expect, it } from "vitest";

import { modelNoticeSchema, type ModelNotice } from "./contracts";
import { normalizeNotice } from "./normalize-notice";

const GOOD = { page: 3, quote: "  Zona 1 — Carolina  " };

function model(overrides: Partial<ModelNotice> = {}): ModelNotice {
  return {
    documentKind: "water_service_notice",
    title: { value: "  Plan de Interrupciones  ", evidence: GOOD, confidence: "high" },
    issuingOrganization: { value: "AAA", evidence: GOOD, confidence: "high" },
    publicationDate: { value: "   ", evidence: { page: 1, quote: "" }, confidence: "low" },
    affectedAreas: [],
    interruptionWindows: [],
    resources: [],
    residentInstructions: [],
    ...overrides,
  };
}

describe("normalizeNotice", () => {
  it("trims values, keeps Spanish as written, and never marks anything edited", () => {
    const notice = normalizeNotice(model());

    expect(notice.title.value).toBe("Plan de Interrupciones");
    expect(notice.title.edited).toBe(false);
    expect(notice.title.evidence.quote).toBe("Zona 1 — Carolina");
  });

  it("turns a blank optional value into null and marks it for review", () => {
    const notice = normalizeNotice(model());

    expect(notice.publicationDate.value).toBeNull();
    expect(notice.publicationDate.reviewStatus).toBe("needs_review");
  });

  it("gives stable ids by position in each list", () => {
    const notice = normalizeNotice(
      model({
        affectedAreas: [
          { zone: "Zona 1", municipality: "Carolina", communities: [], evidence: GOOD, confidence: "high" },
          { zone: null, municipality: "Loíza", communities: [], evidence: GOOD, confidence: "high" },
        ],
        interruptionWindows: [
          { zone: null, start: null, end: null, description: "Rotación", evidence: GOOD, confidence: "low" },
        ],
        resources: [
          { name: "Pozo Escorial", locationDescription: null, hours: null, evidence: GOOD, confidence: "high" },
        ],
        residentInstructions: [{ text: "Almacene agua", evidence: GOOD, confidence: "medium" }],
      }),
    );

    expect(notice.affectedAreas.map((a) => a.id)).toEqual(["area-0", "area-1"]);
    expect(notice.interruptionWindows[0].id).toBe("window-0");
    expect(notice.resources[0].id).toBe("resource-0");
    expect(notice.residentInstructions[0].id).toBe("instruction-0");
  });

  it("drops list items that carry nothing at all and renumbers the rest", () => {
    const notice = normalizeNotice(
      model({
        resources: [
          { name: "   ", locationDescription: "  ", hours: null, evidence: GOOD, confidence: "high" },
          { name: "Pozo Escorial", locationDescription: "  ", hours: "  ", evidence: GOOD, confidence: "high" },
        ],
        affectedAreas: [
          { zone: " ", municipality: " ", communities: [], evidence: GOOD, confidence: "high" },
        ],
        residentInstructions: [{ text: "  ", evidence: GOOD, confidence: "high" }],
      }),
    );

    expect(notice.resources).toHaveLength(1);
    expect(notice.resources[0]).toMatchObject({
      id: "resource-0",
      name: "Pozo Escorial",
      locationDescription: null,
      hours: null,
    });
    expect(notice.affectedAreas).toEqual([]);
    expect(notice.residentInstructions).toEqual([]);
  });

  it("keeps an item whose primary value is blank but that still carries facts, flagged for review", () => {
    const notice = normalizeNotice(
      model({
        resources: [
          { name: " ", locationDescription: "Carolina", hours: null, evidence: GOOD, confidence: "high" },
        ],
        interruptionWindows: [
          { zone: "Zona 1", start: "7 de agosto de 2026, 6:00 A.M.", end: null, description: " ", evidence: GOOD, confidence: "high" },
        ],
        affectedAreas: [
          { zone: null, municipality: " ", communities: ["Sector Las Piñas"], evidence: GOOD, confidence: "high" },
        ],
      }),
    );

    expect(notice.resources).toHaveLength(1);
    expect(notice.resources[0]).toMatchObject({ name: "", locationDescription: "Carolina", reviewStatus: "needs_review" });
    expect(notice.interruptionWindows).toHaveLength(1);
    expect(notice.interruptionWindows[0]).toMatchObject({ start: "7 de agosto de 2026, 6:00 A.M.", description: "" });
    expect(notice.affectedAreas).toHaveLength(1);
    expect(notice.affectedAreas[0]).toMatchObject({ communities: ["Sector Las Piñas"], reviewStatus: "needs_review" });
  });

  it("keeps community names as separate trimmed items", () => {
    const notice = normalizeNotice(
      model({
        affectedAreas: [
          {
            zone: "Zona 2",
            municipality: "Río Grande",
            communities: [" Barrio Guzmán Abajo ", "", "Sector Las Picúas"],
            evidence: GOOD,
            confidence: "high",
          },
        ],
      }),
    );

    expect(notice.affectedAreas[0].communities).toEqual([
      "Barrio Guzmán Abajo",
      "Sector Las Picúas",
    ]);
  });

  it.each([
    ["zero", 0],
    ["negative", -2],
    ["fractional", 2.5],
  ])("drops a %s page number", (_label, page) => {
    const notice = normalizeNotice(
      model({ title: { value: "Aviso", evidence: { page, quote: "Aviso" }, confidence: "high" } }),
    );

    expect(notice.title.evidence.page).toBeNull();
    expect(notice.title.reviewStatus).toBe("needs_review");
  });

  it("caps the quote at 300 characters", () => {
    const notice = normalizeNotice(
      model({
        title: { value: "Aviso", evidence: { page: 1, quote: "a".repeat(400) }, confidence: "high" },
      }),
    );

    expect(notice.title.evidence.quote).toHaveLength(300);
  });

  it("is deterministic", () => {
    const input = model({
      resources: [
        { name: "Pozo Escorial", locationDescription: "Carolina", hours: null, evidence: GOOD, confidence: "high" },
      ],
    });

    expect(normalizeNotice(input)).toEqual(normalizeNotice(input));
  });

  it("cannot carry coordinates a model invented", () => {
    // The schema strips unknown keys, so lat/lng never reach normalizeNotice at all.
    const parsed = modelNoticeSchema.parse(
      model({
        resources: [
          {
            name: "Pozo Escorial",
            locationDescription: "Carolina",
            hours: null,
            evidence: GOOD,
            confidence: "high",
            // @ts-expect-error the contract deliberately has no coordinate fields
            lat: 18.392,
            lng: -65.962,
          },
        ],
      }),
    );

    expect(parsed.resources[0]).not.toHaveProperty("lat");
    expect(JSON.stringify(normalizeNotice(parsed))).not.toMatch(/lat|lng/);
  });
});
