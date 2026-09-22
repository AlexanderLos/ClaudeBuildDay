import { describe, expect, it } from "vitest";

import { PUBLISHED_STORAGE_KEY, type PublishedNotice } from "./contracts";
import { loadPublishedNotices, savePublishedNotice } from "./storage";

const evidence = { page: 1, quote: "Aviso" };

const field = {
  value: "Plan de Interrupciones",
  evidence,
  confidence: "high" as const,
  reviewStatus: "matched" as const,
  edited: false,
};

function published(id: string, publishedAt: string): PublishedNotice {
  return {
    schemaVersion: 1,
    id,
    publishedAt,
    origin: "ai_extraction",
    sourceFileName: "aviso-aaa.pdf",
    notice: {
      title: field,
      issuingOrganization: { ...field, value: "AAA" },
      publicationDate: { ...field, value: null },
      affectedAreas: [],
      interruptionWindows: [],
      resources: [],
      residentInstructions: [],
    },
    mapResources: [],
  };
}

describe("published notice storage", () => {
  it("round trips a notice", () => {
    const notice = published("first", "2026-09-20T10:00:00.000Z");

    expect(savePublishedNotice(window.localStorage, notice)).toBe(true);
    expect(loadPublishedNotices(window.localStorage)).toEqual([notice]);
  });

  it("returns the newest first", () => {
    savePublishedNotice(window.localStorage, published("first", "2026-09-20T10:00:00.000Z"));
    savePublishedNotice(window.localStorage, published("second", "2026-09-20T11:00:00.000Z"));

    expect(loadPublishedNotices(window.localStorage).map((n) => n.id)).toEqual([
      "second",
      "first",
    ]);
  });

  it("reads an empty list when nothing was ever stored", () => {
    expect(loadPublishedNotices(window.localStorage)).toEqual([]);
  });

  it.each([
    ["corrupt JSON", "{not json"],
    ["a wrong schema version", JSON.stringify({ schemaVersion: 99, notices: [] })],
    ["an unexpected shape", JSON.stringify({ notices: "none" })],
  ])("reads an empty list for %s", (_label, raw) => {
    window.localStorage.setItem(PUBLISHED_STORAGE_KEY, raw);

    expect(loadPublishedNotices(window.localStorage)).toEqual([]);
  });

  it("reports failure when the browser refuses the write", () => {
    const refusing = {
      getItem: () => null,
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
    } as unknown as Storage;

    expect(savePublishedNotice(refusing, published("first", "2026-09-20T10:00:00.000Z"))).toBe(
      false,
    );
  });
});
