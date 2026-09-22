import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PDF_FORM_FIELD } from "@/lib/contracts";
import { SAMPLE_NOTICE } from "@/lib/sample-notice";
import { requestExtraction } from "./extract-notice-client";

const fetchMock = vi.fn();
const pdf = () => new File(["%PDF-1.4"], "aviso.pdf", { type: "application/pdf" });
/** requestExtraction only reads `.json()`, so a minimal stand-in is enough. */
const body = (json: () => Promise<unknown>) => ({ json }) as Response;

beforeEach(() => vi.stubGlobal("fetch", fetchMock));
afterEach(() => vi.unstubAllGlobals());

describe("requestExtraction", () => {
  it("posts the PDF as multipart and returns the notice", async () => {
    fetchMock.mockResolvedValue(body(async () => ({ ok: true, notice: SAMPLE_NOTICE })));

    const result = await requestExtraction(pdf());

    expect(result).toEqual({ ok: true, notice: SAMPLE_NOTICE });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/extract-notice");
    expect(init.method).toBe("POST");
    expect((init.body as FormData).get(PDF_FORM_FIELD)).toBeInstanceOf(File);
  });

  it("passes an API error envelope through untouched", async () => {
    fetchMock.mockResolvedValue(body(async () => ({ ok: false, error: { code: "not_a_notice" } })));

    expect(await requestExtraction(pdf())).toEqual({
      ok: false,
      error: { code: "not_a_notice" },
    });
  });

  it("reports network when the request never reaches the server", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    expect(await requestExtraction(pdf())).toEqual({ ok: false, error: { code: "network" } });
  });

  it("reports unknown when the body is not JSON", async () => {
    fetchMock.mockResolvedValue(
      body(async () => {
        throw new SyntaxError("Unexpected token <");
      }),
    );

    expect(await requestExtraction(pdf())).toEqual({ ok: false, error: { code: "unknown" } });
  });

  it("reports unknown when the JSON does not match the contract", async () => {
    fetchMock.mockResolvedValue(body(async () => ({ ok: true, notice: { title: "oops" } })));

    expect(await requestExtraction(pdf())).toEqual({ ok: false, error: { code: "unknown" } });
  });

  it("rejects when the caller aborted, so a cancellation is not mistaken for a failure", async () => {
    const controller = new AbortController();
    fetchMock.mockImplementation(() => {
      controller.abort();
      return Promise.reject(new DOMException("Aborted", "AbortError"));
    });

    await expect(requestExtraction(pdf(), controller.signal)).rejects.toThrow();
  });
});
