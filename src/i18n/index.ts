import type { Locale } from "@/lib/contracts";
import { en } from "./en";
import { es } from "./es";

/** The English dictionary defines the shape; every other locale must match it exactly. */
export type Dictionary = typeof en;

export const dictionaries: Record<Locale, Dictionary> = { en, es };

/** Fills {name} placeholders. Unknown placeholders are left as written. */
export function format(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}
