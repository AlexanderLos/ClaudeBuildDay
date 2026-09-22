import { describe, expect, it } from "vitest";
import { API_ERROR_CODES, CLIENT_ERROR_CODES } from "@/lib/contracts";
import { dictionaries, format } from "./index";

/** Flattens a dictionary to "a.b.c" → value so shapes and placeholders can be compared. */
function flatten(value: unknown, prefix = ""): Record<string, string> {
  if (typeof value === "string") return { [prefix]: value };
  return Object.entries(value as Record<string, unknown>).reduce<Record<string, string>>(
    (all, [key, child]) => ({ ...all, ...flatten(child, prefix ? `${prefix}.${key}` : key) }),
    {},
  );
}

const placeholders = (text: string) => (text.match(/\{\w+\}/g) ?? []).sort();

describe("dictionaries", () => {
  const en = flatten(dictionaries.en);
  const es = flatten(dictionaries.es);

  it("English and Spanish have exactly the same keys", () => {
    expect(Object.keys(es).sort()).toEqual(Object.keys(en).sort());
  });

  it("no entry is empty and placeholders match across locales", () => {
    for (const key of Object.keys(en)) {
      expect(en[key].trim(), `en ${key}`).not.toBe("");
      expect(es[key].trim(), `es ${key}`).not.toBe("");
      expect(placeholders(es[key]), key).toEqual(placeholders(en[key]));
    }
  });

  it("every error code has a message in both locales", () => {
    for (const code of [...API_ERROR_CODES, ...CLIENT_ERROR_CODES]) {
      expect(dictionaries.en.errors[code]).toBeTruthy();
      expect(dictionaries.es.errors[code]).toBeTruthy();
    }
  });

  it("never calls model output verified or claims water is available now", () => {
    const banned = /\bverified\b|\bverificad[oa]s?\b|available now|disponible ahora/i;
    for (const [key, text] of [...Object.entries(en), ...Object.entries(es)]) {
      expect(banned.test(text), key).toBe(false);
    }
  });
});

describe("format", () => {
  it("fills known placeholders and leaves unknown ones", () => {
    expect(format("Page {page} of {total}", { page: 3 })).toBe("Page 3 of {total}");
  });
});
