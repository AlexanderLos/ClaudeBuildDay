import { describe, expect, it } from "vitest";

import {
  publishedNoticeSchema,
  type ExtractedNotice,
  type ExtractedResource,
  type ReviewDraft,
} from "./contracts";
import { buildPublishedNotice, createReviewDraft, selectMapResources } from "./publish";

const evidence = { page: 4, quote: "Pozo Escorial, Carolina" };

function resource(overrides: Partial<ExtractedResource>): ExtractedResource {
  return {
    id: "resource-0",
    name: "Pozo Escorial",
    locationDescription: "Carolina",
    hours: "8:00 a. m. – 4:00 p. m.",
    evidence,
    confidence: "high",
    reviewStatus: "matched",
    edited: false,
    ...overrides,
  };
}

const field = {
  value: "Plan de Interrupciones",
  evidence,
  confidence: "high" as const,
  reviewStatus: "matched" as const,
  edited: false,
};

function notice(resources: ExtractedResource[]): ExtractedNotice {
  return {
    title: field,
    issuingOrganization: { ...field, value: "AAA" },
    publicationDate: { ...field, value: "15 de septiembre de 2026" },
    affectedAreas: [],
    interruptionWindows: [],
    resources,
    residentInstructions: [],
  };
}

function draft(resources: ExtractedResource[]): ReviewDraft {
  return createReviewDraft({
    notice: notice(resources),
    origin: "ai_extraction",
    sourceFileName: "aviso-aaa.pdf",
  });
}

const mapped = resource({});
const unmappable = resource({ id: "resource-1", name: "Camión cisterna", locationDescription: null });

describe("createReviewDraft", () => {
  it("suggests a candidate but approves nothing", () => {
    const reviewDraft = draft([mapped, unmappable]);

    expect(reviewDraft.approvals).toEqual({
      "resource-0": { candidateId: "pozo-escorial", approved: false },
      "resource-1": { candidateId: null, approved: false },
    });
  });

  it("publishes no map resources until a coordinator approves", () => {
    expect(selectMapResources(draft([mapped]))).toEqual([]);
  });
});

describe("selectMapResources", () => {
  it("uses the catalogue coordinate for an approved resource", () => {
    const reviewDraft = draft([mapped, unmappable]);
    reviewDraft.approvals["resource-0"].approved = true;

    expect(selectMapResources(reviewDraft)).toEqual([
      {
        id: "map-resource-0",
        resourceId: "resource-0",
        name: "Pozo Escorial",
        locationDescription: "Carolina",
        hours: "8:00 a. m. – 4:00 p. m.",
        lat: 18.392,
        lng: -65.962,
        coordinateSource: "curated_demo",
        candidateId: "pozo-escorial",
        candidateName: "Pozo Escorial",
        evidence,
        reviewStatus: "matched",
      },
    ]);
  });

  it("publishes nothing for an approved resource with no candidate", () => {
    const reviewDraft = draft([unmappable]);
    reviewDraft.approvals["resource-1"].approved = true;

    expect(selectMapResources(reviewDraft)).toEqual([]);
  });

  it("publishes nothing for an approved resource whose candidate is unknown", () => {
    const reviewDraft = draft([mapped]);
    reviewDraft.approvals["resource-0"] = { candidateId: "pozo-inventado", approved: true };

    expect(selectMapResources(reviewDraft)).toEqual([]);
  });
});

describe("buildPublishedNotice", () => {
  it("keeps unmappable resources and preserves provenance", () => {
    const reviewDraft = draft([mapped, unmappable]);
    reviewDraft.approvals["resource-0"].approved = true;

    const published = buildPublishedNotice(reviewDraft, {
      now: new Date("2026-09-20T15:04:05.000Z"),
      id: "published-1",
    });

    expect(publishedNoticeSchema.safeParse(published).success).toBe(true);
    expect(published).toMatchObject({
      schemaVersion: 1,
      id: "published-1",
      publishedAt: "2026-09-20T15:04:05.000Z",
      origin: "ai_extraction",
      sourceFileName: "aviso-aaa.pdf",
    });
    // The resource without a coordinate is still part of the notice, just not on the map.
    expect(published.notice.resources.map((r) => r.name)).toEqual([
      "Pozo Escorial",
      "Camión cisterna",
    ]);
    expect(published.mapResources.map((r) => r.resourceId)).toEqual(["resource-0"]);
    expect(published.notice.resources[0]).toMatchObject({
      evidence,
      reviewStatus: "matched",
      edited: false,
    });
    expect(published.notice.publicationDate.value).toBe("15 de septiembre de 2026");
  });
});
