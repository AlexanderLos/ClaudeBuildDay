/**
 * POST /api/extract-notice — multipart PDF in, reviewable notice or an error code out.
 *
 * The body is exactly `{ ok: true, notice }` or `{ ok: false, error: { code } }`. No prose, no
 * details: the UI translates codes, and an upstream message could leak the payload or the key.
 */
import { API_ERROR_STATUS, PDF_FORM_FIELD, type ApiErrorCode } from "@/lib/contracts";
import { MAX_PDF_BYTES, checkPdfMeta, hasPdfSignature } from "@/lib/pdf-rules";
import { extractNotice } from "@/server/extract-notice";

/** A long notice can take minutes; the extraction deadline sits just under this. */
export const maxDuration = 300;

const NO_STORE = { "Cache-Control": "no-store" };

function fail(code: ApiErrorCode) {
  return Response.json(
    { ok: false, error: { code } },
    { status: API_ERROR_STATUS[code], headers: NO_STORE },
  );
}

export async function POST(request: Request) {
  try {
    // formData() buffers the whole body, so refuse an oversized upload before reading it. The
    // slack covers multipart framing. A chunked body has no length and is checked after parsing.
    const declaredLength = Number(request.headers.get("content-length"));
    if (declaredLength > MAX_PDF_BYTES + 1024 * 1024) return fail("file_too_large");

    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      return fail("invalid_form");
    }

    const file = form.get(PDF_FORM_FIELD);
    if (!(file instanceof File)) return fail("missing_file");

    // Declared type, extension and size, before the content sniff.
    const violation = checkPdfMeta({ name: file.name, type: file.type, size: file.size });
    if (violation) return fail(violation);

    const bytes = new Uint8Array(await file.arrayBuffer());
    // The declared type is client-supplied; the signature is not.
    if (!hasPdfSignature(bytes)) return fail("unsupported_type");

    const result = await extractNotice(bytes);
    if (!result.ok) return fail(result.code);

    return Response.json({ ok: true, notice: result.notice }, { status: 200, headers: NO_STORE });
  } catch {
    return fail("unknown");
  }
}
