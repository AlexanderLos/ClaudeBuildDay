/**
 * Shared contracts for Agua Vecina (Chunk 1).
 *
 * Truthfulness rules encoded here:
 * - Model output is never "verified". A value is `matched` only when it carries a usable
 *   page + quote reference for the coordinator to check; otherwise it is `needs_review`.
 * - The model is never asked for, and never supplies, coordinates. Object schemas below strip
 *   unknown keys, so a stray `lat`/`lng` in model output is dropped.
 * - Map coordinates only ever come from the curated demo catalogue, after explicit approval.
 */
import { z } from "zod";

/* ───────────── Locale ───────────── */

export const LOCALES = ["en", "es"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_STORAGE_KEY = "agua-vecina:locale:v1";

export function isLocale(value: unknown): value is Locale {
  return value === "en" || value === "es";
}

/* ───────────── Evidence, confidence, review status ───────────── */

export const reviewStatusSchema = z.enum(["matched", "needs_review"]);
export type ReviewStatus = z.infer<typeof reviewStatusSchema>;

export const confidenceSchema = z.enum(["high", "medium", "low"]);
export type Confidence = z.infer<typeof confidenceSchema>;

/** Where in the PDF a value came from. `page` is 1-based; `quote` is a short verbatim excerpt. */
export const sourceEvidenceSchema = z.object({
  page: z.number().nullable(),
  quote: z.string(),
});
export type SourceEvidence = z.infer<typeof sourceEvidenceSchema>;

/**
 * The single rule for review status. "Matched to notice" means there is a usable reference for
 * the coordinator to check. It does not mean the fact was independently proven.
 */
export function deriveReviewStatus(input: {
  hasValue: boolean;
  evidence: SourceEvidence;
  confidence: Confidence;
}): ReviewStatus {
  const { hasValue, evidence, confidence } = input;
  const hasPage =
    evidence.page !== null && Number.isInteger(evidence.page) && evidence.page > 0;
  const hasQuote = evidence.quote.trim().length > 0;
  return hasValue && hasPage && hasQuote && confidence === "high"
    ? "matched"
    : "needs_review";
}

/* ───────────── Model output contract (what Claude is asked to return) ───────────── */

const modelMeta = { evidence: sourceEvidenceSchema, confidence: confidenceSchema };

/** Deliberately contains no latitude/longitude fields. */
export const modelNoticeSchema = z.object({
  documentKind: z.enum(["water_service_notice", "other"]),
  title: z.object({ value: z.string(), ...modelMeta }),
  issuingOrganization: z.object({ value: z.string(), ...modelMeta }),
  publicationDate: z.object({ value: z.string().nullable(), ...modelMeta }),
  affectedAreas: z.array(
    z.object({
      zone: z.string().nullable(),
      municipality: z.string(),
      communities: z.array(z.string()),
      ...modelMeta,
    }),
  ),
  interruptionWindows: z.array(
    z.object({
      zone: z.string().nullable(),
      start: z.string().nullable(),
      end: z.string().nullable(),
      description: z.string(),
      ...modelMeta,
    }),
  ),
  resources: z.array(
    z.object({
      name: z.string(),
      locationDescription: z.string().nullable(),
      hours: z.string().nullable(),
      ...modelMeta,
    }),
  ),
  residentInstructions: z.array(z.object({ text: z.string(), ...modelMeta })),
});
export type ModelNotice = z.infer<typeof modelNoticeSchema>;

/* ───────────── Normalized notice (what the API returns and the UI reviews) ───────────── */

const reviewMeta = {
  evidence: sourceEvidenceSchema,
  confidence: confidenceSchema,
  reviewStatus: reviewStatusSchema,
  /** True once the coordinator changes the value by hand. */
  edited: z.boolean(),
};

export const affectedAreaSchema = z.object({
  id: z.string(),
  /** Group label exactly as the notice states it (e.g. "Zona 1"), or null when ungrouped. */
  zone: z.string().nullable(),
  municipality: z.string(),
  communities: z.array(z.string()),
  ...reviewMeta,
});
export type AffectedArea = z.infer<typeof affectedAreaSchema>;

export const interruptionWindowSchema = z.object({
  id: z.string(),
  /** Group label this window applies to (e.g. "Zona 2"), or null when it applies to everyone. */
  zone: z.string().nullable(),
  /** Date/time text as stated in the notice, or null when not stated. Never inferred. */
  start: z.string().nullable(),
  end: z.string().nullable(),
  description: z.string(),
  ...reviewMeta,
});
export type InterruptionWindow = z.infer<typeof interruptionWindowSchema>;

export const extractedResourceSchema = z.object({
  id: z.string(),
  name: z.string(),
  locationDescription: z.string().nullable(),
  /** Only when the notice states hours explicitly. */
  hours: z.string().nullable(),
  ...reviewMeta,
});
export type ExtractedResource = z.infer<typeof extractedResourceSchema>;

export const residentInstructionSchema = z.object({
  id: z.string(),
  text: z.string(),
  ...reviewMeta,
});
export type ResidentInstruction = z.infer<typeof residentInstructionSchema>;

export const textFieldSchema = z.object({ value: z.string(), ...reviewMeta });
export type TextField = z.infer<typeof textFieldSchema>;

export const nullableTextFieldSchema = z.object({
  value: z.string().nullable(),
  ...reviewMeta,
});
export type NullableTextField = z.infer<typeof nullableTextFieldSchema>;

export const extractedNoticeSchema = z.object({
  title: textFieldSchema,
  issuingOrganization: textFieldSchema,
  publicationDate: nullableTextFieldSchema,
  affectedAreas: z.array(affectedAreaSchema),
  interruptionWindows: z.array(interruptionWindowSchema),
  resources: z.array(extractedResourceSchema),
  residentInstructions: z.array(residentInstructionSchema),
});
export type ExtractedNotice = z.infer<typeof extractedNoticeSchema>;

/* ───────────── Error codes and the API envelope ───────────── */

/** Codes `POST /api/extract-notice` can return. The UI translates codes; the API sends no prose. */
export const API_ERROR_CODES = [
  "invalid_form",
  "missing_file",
  "unsupported_type",
  "file_too_large",
  "not_configured",
  "timeout",
  "malformed_output",
  "model_refusal",
  "not_a_notice",
  "upstream_bad_request",
  "upstream_auth",
  "upstream_too_large",
  "rate_limited",
  "upstream_unavailable",
  "unknown",
] as const;
export type ApiErrorCode = (typeof API_ERROR_CODES)[number];

/** Failures that happen in the browser, outside the API. */
export const CLIENT_ERROR_CODES = ["network", "storage_failed"] as const;
export type ClientErrorCode = (typeof CLIENT_ERROR_CODES)[number];

export type ErrorCode = ApiErrorCode | ClientErrorCode;

export const API_ERROR_STATUS: Record<ApiErrorCode, number> = {
  invalid_form: 400,
  missing_file: 400,
  unsupported_type: 415,
  file_too_large: 413,
  not_configured: 503,
  timeout: 504,
  malformed_output: 502,
  model_refusal: 422,
  not_a_notice: 422,
  upstream_bad_request: 502,
  upstream_auth: 502,
  upstream_too_large: 502,
  rate_limited: 429,
  upstream_unavailable: 502,
  unknown: 500,
};

export const extractNoticeResponseSchema = z.discriminatedUnion("ok", [
  z.object({ ok: z.literal(true), notice: extractedNoticeSchema }),
  z.object({
    ok: z.literal(false),
    error: z.object({ code: z.enum(API_ERROR_CODES) }),
  }),
]);
export type ExtractNoticeResponse = z.infer<typeof extractNoticeResponseSchema>;

/** Multipart field name for the uploaded PDF. */
export const PDF_FORM_FIELD = "file";

/* ───────────── Curated coordinates and approval ───────────── */

/** A hand-curated DEMO coordinate. Not surveyed, not from the notice, never from the model. */
export type CuratedCoordinateCandidate = {
  id: string;
  name: string;
  /** Normalized search terms (lowercase, no diacritics) that identify this place. */
  aliases: readonly string[];
  lat: number;
  lng: number;
  source: "design_demo";
};

/** The coordinator's decision for one extracted resource. */
export type ResourceApproval = {
  /** Suggested curated candidate, or null when nothing in the catalogue matches. */
  candidateId: string | null;
  /** Only true after the coordinator explicitly approves the suggestion. */
  approved: boolean;
};

export const noticeOriginSchema = z.enum(["ai_extraction", "demo_sample"]);
export type NoticeOrigin = z.infer<typeof noticeOriginSchema>;

/** Everything the review screen holds. Survives language changes untouched. */
export type ReviewDraft = {
  notice: ExtractedNotice;
  approvals: Record<string, ResourceApproval>;
  origin: NoticeOrigin;
  sourceFileName: string | null;
};

/* ───────────── Published notice (versioned local storage) ───────────── */

export const PUBLISHED_STORAGE_KEY = "agua-vecina:published-notices:v1";
export const PUBLISHED_SCHEMA_VERSION = 1;

export const publishedResourceSchema = z.object({
  id: z.string(),
  /** Id of the extracted resource this marker came from. */
  resourceId: z.string(),
  name: z.string(),
  locationDescription: z.string().nullable(),
  hours: z.string().nullable(),
  lat: z.number(),
  lng: z.number(),
  coordinateSource: z.literal("curated_demo"),
  candidateId: z.string(),
  candidateName: z.string(),
  evidence: sourceEvidenceSchema,
  reviewStatus: reviewStatusSchema,
});
export type PublishedResource = z.infer<typeof publishedResourceSchema>;

export const publishedNoticeSchema = z.object({
  schemaVersion: z.literal(PUBLISHED_SCHEMA_VERSION),
  id: z.string(),
  /** When the coordinator published, ISO 8601. Not the notice's own publication date. */
  publishedAt: z.string(),
  origin: noticeOriginSchema,
  sourceFileName: z.string().nullable(),
  /** The full reviewed notice, including resources that could not be mapped. */
  notice: extractedNoticeSchema,
  /** Only explicitly approved resources with curated coordinates. */
  mapResources: z.array(publishedResourceSchema),
});
export type PublishedNotice = z.infer<typeof publishedNoticeSchema>;

export const publishedStoreSchema = z.object({
  schemaVersion: z.literal(PUBLISHED_SCHEMA_VERSION),
  notices: z.array(publishedNoticeSchema),
});
export type PublishedStore = z.infer<typeof publishedStoreSchema>;
