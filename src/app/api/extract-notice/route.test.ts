// @vitest-environment node
/**
 * Route + extraction behaviour. The SDK module is mocked but keeps its REAL error classes, so the
 * `instanceof` chain in extract-notice.ts is genuinely exercised. Nothing here touches the network.
 */
import {
  APIConnectionTimeoutError,
  APIError,
  AuthenticationError,
  BadRequestError,
  InternalServerError,
  RateLimitError,
} from "@anthropic-ai/sdk";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  extractNoticeResponseSchema,
  extractedNoticeSchema,
  PDF_FORM_FIELD,
} from "@/lib/contracts";
import { MAX_PDF_BYTES } from "@/lib/pdf-rules";

import { POST } from "./route";

type StreamCall = { params: Record<string, unknown>; options: Record<string, unknown> };

const sdk = vi.hoisted(() => ({
  constructed: [] as unknown[],
  calls: [] as { params: Record<string, unknown>; options: Record<string, unknown> }[],
  /** What the fake `finalMessage()` does next. */
  outcome: null as { message: unknown } | { thrown: unknown } | null,
}));

vi.mock("@anthropic-ai/sdk", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@anthropic-ai/sdk")>();
  class FakeAnthropic {
    messages = {
      stream: (params: Record<string, unknown>, options: Record<string, unknown>) => {
        sdk.calls.push({ params, options });
        return {
          finalMessage: async () => {
            const outcome = sdk.outcome;
            if (outcome && "thrown" in outcome) throw outcome.thrown;
            return outcome?.message;
          },
        };
      },
    };
    constructor(options: unknown) {
      sdk.constructed.push(options);
    }
  }
  // Real error classes, fake client.
  return { ...actual, default: FakeAnthropic };
});

/* ───────────── fixtures ───────────── */

const EVIDENCE = { page: 2, quote: "Zona 1 — Carolina" };

function modelNotice(overrides: Record<string, unknown> = {}) {
  return {
    documentKind: "water_service_notice",
    title: {
      value: "Plan de Interrupciones Programadas",
      evidence: { page: 1, quote: "Plan de Interrupciones Programadas" },
      confidence: "high",
    },
    issuingOrganization: {
      value: "Autoridad de Acueductos y Alcantarillados",
      evidence: { page: 1, quote: "Autoridad de Acueductos y Alcantarillados" },
      confidence: "high",
    },
    publicationDate: {
      value: "15 de septiembre de 2026",
      evidence: { page: 1, quote: "15 de septiembre de 2026" },
      confidence: "high",
    },
    affectedAreas: [
      {
        zone: "Zona 1",
        municipality: "Carolina",
        communities: ["Barrio Hoyo Mulas"],
        evidence: EVIDENCE,
        confidence: "high",
      },
    ],
    interruptionWindows: [
      {
        zone: "Zona 1",
        start: "6:00 a. m.",
        end: "6:00 p. m.",
        description: "Interrupción programada del servicio",
        evidence: EVIDENCE,
        confidence: "high",
      },
    ],
    resources: [
      {
        name: "Pozo Escorial",
        locationDescription: "Carolina",
        hours: null,
        evidence: EVIDENCE,
        confidence: "high",
      },
    ],
    residentInstructions: [
      { text: "Almacene agua para sus necesidades", evidence: EVIDENCE, confidence: "medium" },
    ],
    ...overrides,
  };
}

function pdfBytes(size = 512): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(new ArrayBuffer(size));
  bytes.set(new TextEncoder().encode("%PDF-1.4\n"));
  return bytes;
}

function pdfFile(options: { name?: string; type?: string; bytes?: Uint8Array<ArrayBuffer> } = {}) {
  return new File([options.bytes ?? pdfBytes()], options.name ?? "aviso.pdf", {
    type: options.type ?? "application/pdf",
  });
}

function postForm(value?: FormDataEntryValue, field = PDF_FORM_FIELD) {
  const form = new FormData();
  if (value !== undefined) form.append(field, value);
  return new Request("http://localhost/api/extract-notice", { method: "POST", body: form });
}

async function readBody(response: Response) {
  const body: unknown = await response.json();
  // Every response the route emits must satisfy the shared envelope.
  expect(extractNoticeResponseSchema.safeParse(body).success).toBe(true);
  return body as Record<string, unknown>;
}

function lastCall(): StreamCall {
  const call = sdk.calls.at(-1);
  if (!call) throw new Error("the SDK was never called");
  return call;
}

beforeEach(() => {
  sdk.constructed.length = 0;
  sdk.calls.length = 0;
  sdk.outcome = { message: { stop_reason: "end_turn", parsed_output: modelNotice(), content: [] } };
  vi.stubEnv("ANTHROPIC_API_KEY", "test-key");
  vi.stubEnv("ANTHROPIC_MODEL", undefined);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllEnvs();
});

/* ───────────── happy path and request shape ───────────── */

describe("POST /api/extract-notice", () => {
  it("returns a notice that satisfies the shared contract", async () => {
    const response = await POST(postForm(pdfFile()));

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    const body = await readBody(response);
    expect(body.ok).toBe(true);
    expect(extractedNoticeSchema.safeParse(body.notice).success).toBe(true);
  });

  it("sends the PDF as a base64 document block before the instruction", async () => {
    await POST(postForm(pdfFile()));

    const content = lastCall().params.messages as {
      role: string;
      content: Record<string, unknown>[];
    }[];
    expect(content).toHaveLength(1);
    expect(content[0].role).toBe("user");
    const [document, instruction] = content[0].content;
    expect(document.type).toBe("document");
    expect(document.source).toMatchObject({ type: "base64", media_type: "application/pdf" });
    const data = (document.source as { data: string }).data;
    expect(Buffer.from(data, "base64").subarray(0, 5).toString()).toBe("%PDF-");
    expect(instruction.type).toBe("text");
    // Citations are incompatible with output_config.format.
    expect(document.citations).toBeUndefined();
  });

  it("uses claude-fable-5-1 by default and ANTHROPIC_MODEL when set", async () => {
    await POST(postForm(pdfFile()));
    expect(lastCall().params.model).toBe("claude-fable-5-1");

    vi.stubEnv("ANTHROPIC_MODEL", "claude-fable-5-1-custom");
    await POST(postForm(pdfFile()));
    expect(lastCall().params.model).toBe("claude-fable-5-1-custom");
  });

  it("requests structured output and sends nothing Claude Fable 5.1 rejects", async () => {
    await POST(postForm(pdfFile()));

    const { params, options } = lastCall();
    expect(params.output_config).toMatchObject({ format: { type: "json_schema" } });
    expect(params.max_tokens).toBe(32_000);
    for (const forbidden of [
      "thinking",
      "temperature",
      "top_p",
      "top_k",
      "tools",
      "tool_choice",
      "betas",
      "fallbacks",
    ]) {
      expect(Object.keys(params)).not.toContain(forbidden);
    }
    // No assistant prefill.
    expect((params.messages as { role: string }[]).every((m) => m.role === "user")).toBe(true);
    // A deadline bounds the whole request.
    expect(options.signal).toBeInstanceOf(AbortSignal);
    expect(sdk.constructed).toEqual([expect.objectContaining({ maxRetries: 1 })]);
  });

  it("strips coordinates a model supplies", async () => {
    sdk.outcome = {
      message: {
        stop_reason: "end_turn",
        content: [],
        parsed_output: modelNotice({
          resources: [
            {
              name: "Pozo Escorial",
              locationDescription: "Carolina",
              hours: null,
              lat: 18.392,
              lng: -65.962,
              evidence: EVIDENCE,
              confidence: "high",
            },
          ],
        }),
      },
    };

    const body = await readBody(await POST(postForm(pdfFile())));
    expect(JSON.stringify(body)).not.toMatch(/lat|lng/);
  });
});

/* ───────────── upload rules (enforced before the model is reached) ───────────── */

describe("upload rules", () => {
  it("rejects a missing file", async () => {
    const response = await POST(postForm());
    expect(response.status).toBe(400);
    expect(await readBody(response)).toEqual({ ok: false, error: { code: "missing_file" } });
    expect(sdk.calls).toHaveLength(0);
  });

  it("rejects a field that is not a file", async () => {
    const response = await POST(postForm("aviso.pdf"));
    expect(await readBody(response)).toEqual({ ok: false, error: { code: "missing_file" } });
    expect(sdk.calls).toHaveLength(0);
  });

  it("rejects a non-PDF content type", async () => {
    const response = await POST(postForm(pdfFile({ name: "aviso.txt", type: "text/plain" })));
    expect(response.status).toBe(415);
    expect(await readBody(response)).toEqual({ ok: false, error: { code: "unsupported_type" } });
    expect(sdk.calls).toHaveLength(0);
  });

  it("rejects a .pdf name whose bytes are not a PDF", async () => {
    const bytes = new TextEncoder().encode("<html>not a pdf</html>");
    const response = await POST(postForm(pdfFile({ bytes })));
    expect(response.status).toBe(415);
    expect(await readBody(response)).toEqual({ ok: false, error: { code: "unsupported_type" } });
    expect(sdk.calls).toHaveLength(0);
  });

  it("rejects an oversized file without reading it", async () => {
    const bytes = pdfBytes(MAX_PDF_BYTES + 1);
    const response = await POST(postForm(pdfFile({ bytes })));
    expect(response.status).toBe(413);
    expect(await readBody(response)).toEqual({ ok: false, error: { code: "file_too_large" } });
    expect(sdk.calls).toHaveLength(0);
  });

  it("rejects a body that is not valid multipart", async () => {
    const response = await POST(
      new Request("http://localhost/api/extract-notice", {
        method: "POST",
        headers: { "Content-Type": "multipart/form-data; boundary=----aguavecina" },
        body: "this is not a multipart body",
      }),
    );
    expect(response.status).toBe(400);
    expect(await readBody(response)).toEqual({ ok: false, error: { code: "invalid_form" } });
    expect(sdk.calls).toHaveLength(0);
  });
});

/* ───────────── configuration and model outcomes ───────────── */

describe("model outcomes", () => {
  it("reports not_configured without constructing a client", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "   ");
    const response = await POST(postForm(pdfFile()));

    expect(response.status).toBe(503);
    expect(await readBody(response)).toEqual({ ok: false, error: { code: "not_configured" } });
    expect(sdk.constructed).toHaveLength(0);
    expect(sdk.calls).toHaveLength(0);
  });

  it.each([
    ["a null parsed_output", { stop_reason: "end_turn", parsed_output: null, content: [] }],
    [
      "a schema-invalid parsed_output",
      { stop_reason: "end_turn", parsed_output: { documentKind: "water_service_notice" }, content: [] },
    ],
    [
      "truncated output",
      { stop_reason: "max_tokens", parsed_output: modelNotice(), content: [] },
    ],
  ])("reports malformed_output for %s", async (_label, message) => {
    sdk.outcome = { message };
    const response = await POST(postForm(pdfFile()));

    expect(response.status).toBe(502);
    expect(await readBody(response)).toEqual({ ok: false, error: { code: "malformed_output" } });
  });

  it("reports model_refusal when the model declines", async () => {
    sdk.outcome = {
      message: { stop_reason: "refusal", parsed_output: modelNotice(), content: [] },
    };
    const response = await POST(postForm(pdfFile()));

    expect(response.status).toBe(422);
    expect(await readBody(response)).toEqual({ ok: false, error: { code: "model_refusal" } });
  });

  it("reports not_a_notice for another kind of document", async () => {
    sdk.outcome = {
      message: {
        stop_reason: "end_turn",
        content: [],
        parsed_output: modelNotice({
          documentKind: "other",
          affectedAreas: [],
          interruptionWindows: [],
          resources: [],
          residentInstructions: [],
        }),
      },
    };
    const response = await POST(postForm(pdfFile()));

    expect(response.status).toBe(422);
    expect(await readBody(response)).toEqual({ ok: false, error: { code: "not_a_notice" } });
  });
});

/* ───────────── SDK error mapping (real error classes) ───────────── */

describe("upstream errors", () => {
  const headers = new Headers();

  it.each([
    ["RateLimitError", new RateLimitError(429, undefined, "rate limited", headers), 429, "rate_limited"],
    [
      "InternalServerError",
      new InternalServerError(529, undefined, "overloaded", headers),
      502,
      "upstream_unavailable",
    ],
    [
      "BadRequestError",
      new BadRequestError(400, undefined, "bad request", headers),
      502,
      "upstream_bad_request",
    ],
    [
      "AuthenticationError",
      new AuthenticationError(401, undefined, "unauthenticated", headers),
      502,
      "upstream_auth",
    ],
    [
      "a 413 APIError",
      new APIError(413, undefined, "payload too large", headers),
      502,
      "upstream_too_large",
    ],
    ["APIConnectionTimeoutError", new APIConnectionTimeoutError(), 504, "timeout"],
  ])("maps %s", async (_label, thrown, status, code) => {
    sdk.outcome = { thrown };
    const response = await POST(postForm(pdfFile()));

    expect(response.status).toBe(status);
    const body = await readBody(response);
    expect(body).toEqual({ ok: false, error: { code } });
    // Nothing but the code: no message, no stack, no upstream detail.
    expect(Object.keys(body.error as object)).toEqual(["code"]);
  });

  it("maps an unrecognised failure to unknown", async () => {
    sdk.outcome = { thrown: new Error("boom") };
    const response = await POST(postForm(pdfFile()));

    expect(response.status).toBe(500);
    expect(await readBody(response)).toEqual({ ok: false, error: { code: "unknown" } });
  });
});
