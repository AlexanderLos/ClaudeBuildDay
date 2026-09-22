import { describe, expect, it } from "vitest";

import { checkPdfMeta, hasPdfSignature, MAX_PDF_BYTES, PDF_MIME } from "./pdf-rules";

const pdf = { name: "aviso.pdf", type: PDF_MIME, size: 1024 };

describe("checkPdfMeta", () => {
  it("accepts a normal PDF", () => {
    expect(checkPdfMeta(pdf)).toBeNull();
  });

  it("accepts an empty type when the name ends in .pdf", () => {
    // Browsers report an empty type for some dropped files.
    expect(checkPdfMeta({ ...pdf, type: "" })).toBeNull();
  });

  it("accepts an upper-case extension", () => {
    expect(checkPdfMeta({ ...pdf, name: "AVISO.PDF" })).toBeNull();
  });

  it("accepts a file exactly at the size limit", () => {
    expect(checkPdfMeta({ ...pdf, size: MAX_PDF_BYTES })).toBeNull();
  });

  it.each([
    ["another content type", { type: "text/plain" }],
    ["an empty type and a non-pdf name", { name: "aviso.txt", type: "" }],
    ["a pdf type with a non-pdf name", { name: "aviso.docx" }],
    ["no extension at all", { name: "aviso" }],
  ])("rejects %s", (_label, override) => {
    expect(checkPdfMeta({ ...pdf, ...override })).toBe("unsupported_type");
  });

  it("rejects a file over the size limit", () => {
    expect(checkPdfMeta({ ...pdf, size: MAX_PDF_BYTES + 1 })).toBe("file_too_large");
  });

  it("reports the type before the size", () => {
    expect(checkPdfMeta({ name: "aviso.txt", type: "text/plain", size: MAX_PDF_BYTES + 1 })).toBe(
      "unsupported_type",
    );
  });
});

describe("hasPdfSignature", () => {
  const bytes = (text: string) => new TextEncoder().encode(text);

  it("accepts bytes that start with %PDF-", () => {
    expect(hasPdfSignature(bytes("%PDF-1.4\n%âãÏÓ"))).toBe(true);
  });

  it.each([
    ["HTML", "<html><body>no</body></html>"],
    ["a leading space", " %PDF-1.4"],
    ["an empty file", ""],
    ["a truncated signature", "%PDF"],
  ])("rejects %s", (_label, text) => {
    expect(hasPdfSignature(bytes(text))).toBe(false);
  });
});
