/**
 * Hand-maintained status of the Carraízo / Sergio Cuevas rationing plan. The AAA notice (our source
 * JSON) says nothing about whether the plan is still running, so this comes from dated public
 * reporting, each claim with its source. Re-verify and bump `lastVerified` before relying on it.
 * Client-safe: constants only.
 */
export const PLAN_STATUS = {
  /** "ended" = no scheduled rotation today. Local, unplanned outages can still happen. */
  state: "ended" as "active" | "paused" | "ended",
  startedAt: "2026-08-07T06:00:00-04:00",
  /** Governor announced the pause Sep 2; all zones were to have water by noon that day. */
  pausedAt: "2026-09-02T12:00:00-04:00",
  /** AAA president Luis González Delgado, quoted Sep 17: the reservoir's rise let AAA end the plan. */
  endedReportedOn: "2026-09-17",
  lastVerified: "2026-09-21",
  sources: {
    ended: {
      label: "TeleOnce, Sep 17, 2026 (quoting AAA's president)",
      url: "https://teleonce.com/noticias/locales/carraizo-alcanza-nivel-de-seguridad-y-pone-fin-al-racionamiento-pero-dragado-queda-pendiente/",
    },
    paused: {
      label: "Primera Hora, Sep 2, 2026 (governor's announcement)",
      url: "https://www.primerahora.com/noticias/gobierno-politica/notas/gobernadora-anuncia-pausa-al-racionamiento-para-abonados-de-carraizo/",
    },
    septemberCalendar: {
      label: "El Nuevo Día, Aug 31, 2026 (calendar published by AAA)",
      url: "https://www.elnuevodia.com/noticias/locales/notas/sigue-el-racionamiento-en-carraizo-que-dias-tendran-agua-la-zona-1-y-la-zona-2-en-septiembre/",
    },
  },
} as const;
