/**
 * Browser-side client for `POST /api/extract-notice`.
 *
 * The API answers with an error CODE on every status, never prose, so the body decides the
 * outcome rather than `response.ok`. Anything the browser cannot turn into a valid envelope
 * becomes a client code the UI can translate.
 */
import {
  PDF_FORM_FIELD,
  extractNoticeResponseSchema,
  type ExtractNoticeResponse,
} from "@/lib/contracts";

const EXTRACT_NOTICE_URL = "/api/extract-notice";

export type ExtractionResult =
  | ExtractNoticeResponse
  | { ok: false; error: { code: "network" } };

/**
 * Resolves with the API envelope, or a client code when the browser never got one.
 * Rejects ONLY when `signal` aborted, so the caller can tell a cancellation from a failure
 * and return quietly to the selected-file state instead of showing an error.
 */
export async function requestExtraction(
  file: File,
  signal?: AbortSignal,
): Promise<ExtractionResult> {
  const body = new FormData();
  body.append(PDF_FORM_FIELD, file);

  let response: Response;
  try {
    response = await fetch(EXTRACT_NOTICE_URL, { method: "POST", body, signal });
  } catch (error) {
    if (signal?.aborted) throw error;
    return { ok: false, error: { code: "network" } };
  }

  try {
    const parsed = extractNoticeResponseSchema.safeParse(await response.json());
    return parsed.success ? parsed.data : { ok: false, error: { code: "unknown" } };
  } catch (error) {
    if (signal?.aborted) throw error;
    // Not JSON at all (a proxy error page, a truncated body).
    return { ok: false, error: { code: "unknown" } };
  }
}
