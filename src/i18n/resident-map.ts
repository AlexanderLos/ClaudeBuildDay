/** Resident page shell + map strings (header, status banner, sites panel, map popup). Dates arrive pre-formatted by Intl. */
const en = {
  brand: "Water Neighbor",
  tagline: "From the official AAA notice",
  noticeLink: "Official notice (PDF)",
  helpLink: "How to help",
  volunteerLink: "Volunteer",

  replay: (range: string) => `Replay ${range}`,
  replayHint: "Shows the calendar AAA published for a past date. Off = today's real status.",
  replayDateLabel: "Replay date",

  bannerEnded: "Scheduled rationing has ended",
  bannerEndedDetail: (reported: string, paused: string) =>
    `reported ${reported} (paused since ${paused}). The calendars here are kept for reference. Local outages can still happen: call AAA`,
  lastVerified: (date: string) => `Last verified ${date}`,
  bannerReplay: "Replay mode",
  bannerReplayDetail: (date: string) =>
    `showing the calendar AAA published for ${date}. This is history, not today's status.`,
  exitReplay: "Exit replay",

  mapLabel: "Map of the municipalities affected by the plan",
  zoneCounts: (zone1: number, zone2: number) =>
    `${zone1} ${zone1 === 1 ? "community" : "communities"} in Zone 1 · ${zone2} in Zone 2 (per the notice)`,
  ommeLabel: "OMME",
  typeCommunity: "Type your community in the chat to find your zone.",
  useMyLocation: "Use my location",
  locating: "Locating…",
  locationFailed: "We couldn't get your location.",
  dismiss: "Dismiss",
  yourLocation: "Your location",

  panelButton: "Sites named in the plan",
  listedLabel: "Listed in the official AAA plan · availability not confirmed",
  panelNote:
    "These are mitigation logistics sites named on p. 17 of the notice. AAA did not publish their locations and public access is not confirmed. Call your municipality before going anywhere.",
  listedHours: "Listed hours",
  page: "p.",
  source: "Source",
};

const es: typeof en = {
  brand: "Water Neighbor",
  tagline: "Información del aviso oficial de AAA",
  noticeLink: "Aviso oficial (PDF)",
  helpLink: "Cómo ayudar",
  volunteerLink: "Voluntariado",

  replay: (range: string) => `Repetición ${range}`,
  replayHint: "Muestra el calendario que AAA publicó para una fecha pasada. Apagado = el estado real de hoy.",
  replayDateLabel: "Fecha de la repetición",

  bannerEnded: "El racionamiento programado terminó",
  bannerEndedDetail: (reported: string, paused: string) =>
    `informado el ${reported} (en pausa desde el ${paused}). Los calendarios se conservan aquí como referencia. Todavía pueden ocurrir interrupciones locales: llama a AAA`,
  lastVerified: (date: string) => `Verificado por última vez el ${date}`,
  bannerReplay: "Modo repetición",
  bannerReplayDetail: (date: string) =>
    `mostrando el calendario que AAA publicó para el ${date}. Esto es historia, no el estado de hoy.`,
  exitReplay: "Salir de la repetición",

  mapLabel: "Mapa de los municipios afectados por el plan",
  zoneCounts: (zone1: number, zone2: number) =>
    `${zone1} ${zone1 === 1 ? "comunidad" : "comunidades"} en la Zona 1 · ${zone2} en la Zona 2 (según el aviso)`,
  ommeLabel: "OMME",
  typeCommunity: "Escribe tu comunidad en el chat para saber tu zona.",
  useMyLocation: "Usar mi ubicación",
  locating: "Buscando…",
  locationFailed: "No pudimos obtener tu ubicación.",
  dismiss: "Cerrar",
  yourLocation: "Tu ubicación",

  panelButton: "Lugares nombrados en el plan",
  listedLabel: "Incluido en el plan oficial de AAA · disponibilidad no confirmada",
  panelNote:
    "Son lugares de logística de mitigación nombrados en la p. 17 del aviso. AAA no publicó sus ubicaciones y el acceso público no está confirmado. Llama a tu municipio antes de ir a cualquier lugar.",
  listedHours: "Horario listado",
  page: "p.",
  source: "Fuente",
};

export const residentMap = { en, es };
