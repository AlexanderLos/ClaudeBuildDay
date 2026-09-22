/**
 * Phone lines that are NOT in the AAA notice. The OMME numbers come from the notice itself
 * (`ommeContact()` in plan.ts); these are kept apart so the two sources never blur. Client-safe.
 */
export const AAA_LINE = {
  name: "AAA",
  /** AAA customer service: report no water, leaks and service emergencies. */
  display: "(787) 620-2482",
  tel: "+17876202482",
  /** Per AAA's call-centre page: every day of the year, holidays included. Not a 24-hour line. */
  hours: "6:00 a.m. – 11:00 p.m.",
  sourceLabel: "acueductos.pr.gov",
  /** Opened 2026-09-21: lists "Servicio al Cliente: (787) 620-2482" and describes what the line takes. */
  sourceUrl: "https://www.acueductos.pr.gov/servicios/centro-telefonico",
  lastVerified: "2026-09-21",
} as const;
