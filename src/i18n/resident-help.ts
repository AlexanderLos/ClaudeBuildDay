/**
 * Copy for /help. The organizations were checked by hand on 2026-09-21: each page loaded, and each
 * is named in independent coverage of the 2026 water shortage (`listedBy`). Water Neighbor is not
 * affiliated with any of them. Re-check the links before relying on this list later.
 */
export type HelpOrg = {
  name: string;
  url: string;
  donateUrl: string;
  /** Who independently recommended it for this crisis. */
  listedBy: "today" | "nacionTaina" | "both";
  what: { en: string; es: string };
};

export const HELP_ORGS: HelpOrg[] = [
  {
    name: "Convoy of Hope",
    url: "https://convoyofhope.org/disaster-relief/water-relief-for-puerto-rico-communities/",
    donateUrl: "https://convoyofhope.org/donate/disaster-relief/puerto-rico-water-crisis-2026/",
    listedBy: "both",
    what: {
      en: "Disaster-relief nonprofit shipping bottled water to Puerto Rico for the 2026 water crisis and distributing it with local partners.",
      es: "Organización de respuesta a desastres que envía agua embotellada a Puerto Rico por la crisis de agua de 2026 y la distribuye con aliados locales.",
    },
  },
  {
    name: "Plenitud PR",
    url: "https://www.plenitudpr.org/",
    donateUrl: "https://www.plenitudpr.org/donate",
    listedBy: "nacionTaina",
    what: {
      en: "Puerto Rico–based 501(c)(3) with a Water Security program: rainwater harvesting and filtration systems for homes and community spaces.",
      es: "Organización 501(c)(3) con base en Puerto Rico y un programa de seguridad de agua: sistemas de recogido de agua de lluvia y filtración para hogares y espacios comunitarios.",
    },
  },
  {
    name: "Fundación Comunitaria de Puerto Rico",
    url: "https://www.fcpr.org/",
    donateUrl: "https://www.fcpr.org/donate-2/",
    listedBy: "nacionTaina",
    what: {
      en: "Community foundation that funds and trains local organizations; its “Agua pa’ Nosotros” program works on community water access.",
      es: "Fundación comunitaria que financia y capacita a organizaciones locales; su programa “Agua pa’ Nosotros” trabaja el acceso comunitario al agua.",
    },
  },
  {
    name: "PRxPR",
    url: "https://prxpr.org/",
    donateUrl: "https://prxpr.org/donate/",
    listedBy: "today",
    what: {
      en: "Puerto Rico relief and rebuild fund, a 501(c)(3) that directs donations to community relief programs on the island.",
      es: "Fondo de alivio y reconstrucción para Puerto Rico, una 501(c)(3) que dirige los donativos a programas comunitarios de ayuda en la isla.",
    },
  },
  {
    name: "Direct Relief",
    url: "https://www.directrelief.org/place/puerto-rico/",
    donateUrl: "https://www.directrelief.org/place/puerto-rico/",
    listedBy: "today",
    what: {
      en: "Health-focused charity supplying Puerto Rico’s clinics with medicines and medical supplies — the people hit hardest when water is out.",
      es: "Organización enfocada en salud que suple medicamentos y suministros médicos a clínicas de Puerto Rico, para quienes más sufren cuando falta el agua.",
    },
  },
];

const en = {
  back: "Back to the map",
  title: "How to help",
  intro:
    "These organizations are helping Puerto Rico communities get water during the 2026 shortage, or building the water systems that keep the next one from hurting as much. Visit them, donate, or share them.",
  visit: "Visit site",
  donate: "Donate",
  listedBy: {
    today: "Recommended by TODAY (Aug. 12, 2026)",
    nacionTaina: "Recommended by Nación Taína de Borikén (Sept. 4, 2026)",
    both: "Recommended by TODAY and Nación Taína de Borikén",
  },
  volunteer: "Prefer to help in person?",
  volunteerBody: "Join the volunteer list: deliver water, make calls or translate for a neighbor.",
  volunteerCta: "Become a volunteer",
  needWater: "Need water yourself?",
  needWaterBody: "Find your zone, the official water points and who to call.",
  needWaterCta: "Open the map",
  disclaimer:
    "Water Neighbor is not affiliated with these organizations and receives nothing from them. Links checked September 21, 2026. Review each organization before you give.",
};

const es: typeof en = {
  back: "Volver al mapa",
  title: "Cómo ayudar",
  intro:
    "Estas organizaciones están ayudando a comunidades de Puerto Rico a conseguir agua durante la escasez de 2026, o construyen los sistemas de agua que harán que la próxima duela menos. Visítalas, dona o compártelas.",
  visit: "Visitar página",
  donate: "Donar",
  listedBy: {
    today: "Recomendada por TODAY (12 de agosto de 2026)",
    nacionTaina: "Recomendada por Nación Taína de Borikén (4 de septiembre de 2026)",
    both: "Recomendada por TODAY y Nación Taína de Borikén",
  },
  volunteer: "¿Prefieres ayudar en persona?",
  volunteerBody: "Únete a la lista de voluntariado: entrega agua, haz llamadas o traduce para un vecino.",
  volunteerCta: "Ser persona voluntaria",
  needWater: "¿Necesitas agua?",
  needWaterBody: "Busca tu zona, los puntos oficiales de agua y a quién llamar.",
  needWaterCta: "Abrir el mapa",
  disclaimer:
    "Water Neighbor no está afiliada a estas organizaciones ni recibe nada de ellas. Enlaces verificados el 21 de septiembre de 2026. Evalúa cada organización antes de donar.",
};

export const residentHelp = { en, es };
