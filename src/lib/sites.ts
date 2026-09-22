/** Accent- and case-insensitive key for comparing place names ("Canóvanas" = "canovanas"). */
export function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}
