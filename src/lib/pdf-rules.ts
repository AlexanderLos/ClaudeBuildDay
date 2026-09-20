/** PDF upload rules, shared by the client (fast feedback) and the server (enforcement). */

export const MAX_PDF_BYTES = 10 * 1024 * 1024;
export const PDF_MIME = "application/pdf";

export type PdfRuleViolation = "unsupported_type" | "file_too_large";

/**
 * Checks declared type, extension, and size. Browsers sometimes report an empty type for
 * dropped files, so an empty type is accepted only when the name ends in `.pdf`.
 */
export function checkPdfMeta(file: {
  name: string;
  type: string;
  size: number;
}): PdfRuleViolation | null {
  const namedPdf = file.name.toLowerCase().endsWith(".pdf");
  const typedPdf = file.type === PDF_MIME || (file.type === "" && namedPdf);
  if (!typedPdf || !namedPdf) return "unsupported_type";
  if (file.size > MAX_PDF_BYTES) return "file_too_large";
  return null;
}

/** Server-side content sniff: every PDF starts with `%PDF-`. The declared type is client-supplied. */
export function hasPdfSignature(bytes: Uint8Array): boolean {
  const signature = [0x25, 0x50, 0x44, 0x46, 0x2d];
  return signature.every((byte, i) => bytes[i] === byte);
}
