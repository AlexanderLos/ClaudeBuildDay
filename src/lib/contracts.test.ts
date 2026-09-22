import { describe, expect, it } from "vitest";

import {
  deriveReviewStatus,
  extractedNoticeSchema,
  modelNoticeSchema,
  type Confidence,
  type SourceEvidence,
} from "./contracts";

const evidence: SourceEvidence = { page: 2, quote: "Zona 1" };

const field = {
  value: "Aviso",
  evidence,
  confidence: "high" as const,
  reviewStatus: "matched" as const,
  edited: false,
};

const notice = {
  title: field,
  issuingOrganization: field,
  publicationDate: { ...field, value: null },
  affectedAreas: [],
  interruptionWindows: [],
  resources: [],
  residentInstructions: [],
};

describe("extractedNoticeSchema", () => {
  it("accepts a complete notice", () => {
    expect(extractedNoticeSchema.safeParse(notice).success).toBe(true);
  });

  it("rejects a notice missing a required field", () => {
    const incomplete: Record<string, unknown> = { ...notice };
    delete incomplete.issuingOrganization;
    expect(extractedNoticeSchema.safeParse(incomplete).success).toBe(false);
  });

  it("rejects an unknown review status", () => {
    const malformed = { ...notice, title: { ...field, reviewStatus: "verified" } };
    expect(extractedNoticeSchema.safeParse(malformed).success).toBe(false);
  });
});

describe("modelNoticeSchema", () => {
  it("rejects output that is missing the document kind", () => {
    expect(modelNoticeSchema.safeParse({ title: field }).success).toBe(false);
  });
});

describe("deriveReviewStatus", () => {
  const base = { hasValue: true, evidence, confidence: "high" as Confidence };

  it("matches only a value with a real page, a quote, and high confidence", () => {
    expect(deriveReviewStatus(base)).toBe("matched");
  });

  it.each([
    ["no value", { hasValue: false }],
    ["no page", { evidence: { page: null, quote: "Zona 1" } }],
    ["a page of zero", { evidence: { page: 0, quote: "Zona 1" } }],
    ["a fractional page", { evidence: { page: 1.5, quote: "Zona 1" } }],
    ["a blank quote", { evidence: { page: 2, quote: "   " } }],
    ["medium confidence", { confidence: "medium" as Confidence }],
    ["low confidence", { confidence: "low" as Confidence }],
  ])("needs review with %s", (_label, override) => {
    expect(deriveReviewStatus({ ...base, ...override })).toBe("needs_review");
  });
});
