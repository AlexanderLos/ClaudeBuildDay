import { describe, expect, it } from "vitest";

import {
  CURATED_COORDINATES,
  getCandidateById,
  normalizePlaceText,
  suggestCoordinate,
} from "./curated-coordinates";

const suggest = (name: string, locationDescription: string | null = null) =>
  suggestCoordinate({ name, locationDescription });

describe("suggestCoordinate", () => {
  it("matches a catalogue place named in the notice", () => {
    expect(suggest("Pozo Escorial", "Carolina")?.id).toBe("pozo-escorial");
  });

  it("matches through the location description", () => {
    expect(suggest("Oasis comunitario", "Parque Julia de Burgos")?.id).toBe(
      "parque-julia-de-burgos",
    );
  });

  it.each([
    ["upper case", "POZO ESCORIAL"],
    ["missing accents", "Pozo Escorial"],
    ["extra punctuation and spacing", "  Pozo   Escorial, Carolina.  "],
  ])("ignores %s", (_label, name) => {
    expect(suggest(name)?.id).toBe("pozo-escorial");
  });

  it("keeps accented catalogue names matchable", () => {
    expect(suggest("Plaza de Río Piedras")?.id).toBe("plaza-rio-piedras");
  });

  it("returns the same candidate on repeated calls", () => {
    const first = suggest("Pozo Escorial", "Carolina");
    const second = suggest("Pozo Escorial", "Carolina");
    expect(first).toBe(second);
  });

  it("returns null for a place the catalogue does not know", () => {
    expect(suggest("Pozo Las Américas", "Carolina")).toBeNull();
  });

  it("does not match on a partial word", () => {
    // "Pozo Escorialito" is a different place; guessing a coordinate would be a lie.
    expect(suggest("Pozo Escorialito")).toBeNull();
  });

  it("never invents a coordinate outside the catalogue", () => {
    const candidate = suggest("Isla Verde");
    expect(CURATED_COORDINATES).toContain(candidate);
    expect(candidate?.source).toBe("design_demo");
  });
});

describe("normalizePlaceText", () => {
  it("lowercases, strips diacritics, and collapses punctuation", () => {
    expect(normalizePlaceText("  Plaza de Río Piedras!! ")).toBe("plaza de rio piedras");
  });
});

describe("getCandidateById", () => {
  it("finds a catalogue entry", () => {
    expect(getCandidateById("isla-verde")).toMatchObject({ lat: 18.443, lng: -66.018 });
  });

  it("returns null for an unknown id", () => {
    expect(getCandidateById("pozo-inventado")).toBeNull();
  });
});
