/** Copy for /volunteer. Option values (help, availability, languages) match POST /api/volunteer. */
const en = {
  back: "Back to the map",
  eyebrow: "Volunteer",
  title: "Help a neighbor get water",
  intro:
    "When the water goes out, the people who struggle most are the ones who can't drive to a water station: older adults, families with babies, people who are bedridden. Volunteers close that last mile.",
  statusNote:
    "Scheduled rationing ended on Sep 17, 2026, so there are no active requests right now. We're building the volunteer list now so it's ready before the next interruption.",
  stepsTitle: "How it works",
  steps: [
    { title: "Sign up", body: "Tell us where you can help and how. It takes a minute." },
    {
      title: "A quick conversation",
      body: "The site operator contacts you and adds you to the volunteer group on Telegram.",
    },
    {
      title: "Answer when you can",
      body: "When a neighbor asks for help, the group gets a short brief. Whoever is free calls them and arranges a safe hand-off.",
    },
  ],
  formTitle: "Sign up to volunteer",
  name: "First name",
  phone: "Phone",
  phoneHint: "So the operator can reach you. Never shown publicly.",
  telegram: "Telegram username (optional)",
  telegramHint: "Requests arrive in a Telegram group. No account yet? Leave it blank and we'll call you.",
  municipalities: "Where can you help?",
  help: "How can you help?",
  helpOptions: { deliver: "Deliver water", calls: "Make phone calls", translate: "Translate (ES/EN)" },
  vehicle: "I have a vehicle I can use",
  availability: "When are you usually free? (optional)",
  availabilityOptions: { weekdays: "Weekdays", evenings: "Evenings", weekends: "Weekends" },
  languages: "Languages you speak",
  languageOptions: { es: "Spanish", en: "English" },
  note: "Anything else? (optional)",
  notePlaceholder: "e.g. I have a pickup truck and two 5-gallon containers.",
  consent:
    "I agree that the Water Neighbor site operator may contact me by phone or Telegram about volunteering.",
  submit: "Sign me up",
  submitting: "Sending…",
  pickOne: "Choose at least one.",
  errorGeneric: "Something didn't go through. Check the highlighted fields and try again.",
  errorNetwork: "We couldn't send your sign-up. Check your connection and try again.",
  errorRate: "Too many attempts from this connection. Try again in a few minutes.",
  successTitle: (name: string) => `Thank you, ${name}.`,
  successBody:
    "Your sign-up reached the site operator. They'll contact you before adding you to the volunteer group.",
  demoOnly: "Demo only. No real request will be sent.",
  again: "Sign up someone else",
  safetyTitle: "Before you sign up",
  safety: [
    "This is a community prototype. It is not an AAA, municipal or government program.",
    "Volunteers never enter a home. Agree on a safe public hand-off spot by phone.",
    "Requests include a neighbor's phone number, so everyone in the group is someone the operator has spoken with.",
    "Your details go only to the site operator by Telegram. They are not stored on this site or shared publicly.",
  ],
};

const es: typeof en = {
  back: "Volver al mapa",
  eyebrow: "Voluntariado",
  title: "Ayuda a un vecino a conseguir agua",
  intro:
    "Cuando falta el agua, quienes más sufren son quienes no pueden guiar hasta un punto de agua: personas mayores, familias con bebés, personas encamadas. Las personas voluntarias cubren ese último tramo.",
  statusNote:
    "El racionamiento programado terminó el 17 de septiembre de 2026, así que ahora mismo no hay solicitudes activas. Estamos armando la lista de personas voluntarias para que esté lista antes de la próxima interrupción.",
  stepsTitle: "Cómo funciona",
  steps: [
    { title: "Inscríbete", body: "Dinos dónde puedes ayudar y cómo. Toma un minuto." },
    {
      title: "Una conversación breve",
      body: "El operador del sitio te contacta y te añade al grupo de voluntariado en Telegram.",
    },
    {
      title: "Responde cuando puedas",
      body: "Cuando un vecino pide ayuda, el grupo recibe un resumen corto. Quien esté disponible le llama y coordina una entrega segura.",
    },
  ],
  formTitle: "Inscríbete como persona voluntaria",
  name: "Nombre",
  phone: "Teléfono",
  phoneHint: "Para que el operador pueda contactarte. Nunca se muestra públicamente.",
  telegram: "Usuario de Telegram (opcional)",
  telegramHint:
    "Las solicitudes llegan a un grupo de Telegram. ¿No tienes cuenta? Déjalo en blanco y te llamamos.",
  municipalities: "¿Dónde puedes ayudar?",
  help: "¿Cómo puedes ayudar?",
  helpOptions: { deliver: "Entregar agua", calls: "Hacer llamadas", translate: "Traducir (ES/EN)" },
  vehicle: "Tengo un vehículo que puedo usar",
  availability: "¿Cuándo sueles estar disponible? (opcional)",
  availabilityOptions: { weekdays: "Días de semana", evenings: "Noches", weekends: "Fines de semana" },
  languages: "Idiomas que hablas",
  languageOptions: { es: "Español", en: "Inglés" },
  note: "¿Algo más? (opcional)",
  notePlaceholder: "Ej.: tengo una pickup y dos envases de 5 galones.",
  consent:
    "Autorizo que el operador del sitio Water Neighbor me contacte por teléfono o Telegram sobre el voluntariado.",
  submit: "Inscribirme",
  submitting: "Enviando…",
  pickOne: "Escoge al menos una opción.",
  errorGeneric: "Algo no se pudo enviar. Revisa los campos marcados e intenta de nuevo.",
  errorNetwork: "No pudimos enviar tu inscripción. Revisa tu conexión e intenta de nuevo.",
  errorRate: "Demasiados intentos desde esta conexión. Intenta de nuevo en unos minutos.",
  successTitle: (name: string) => `Gracias, ${name}.`,
  successBody:
    "Tu inscripción le llegó al operador del sitio. Te contactará antes de añadirte al grupo de voluntariado.",
  demoOnly: "Demostración solamente. No se enviará una solicitud real.",
  again: "Inscribir a otra persona",
  safetyTitle: "Antes de inscribirte",
  safety: [
    "Este es un prototipo comunitario. No es un programa de la AAA, de un municipio ni del gobierno.",
    "Las personas voluntarias nunca entran a un hogar. Acuerden por teléfono un punto público y seguro para la entrega.",
    "Las solicitudes incluyen el teléfono de un vecino, así que todas las personas del grupo han hablado antes con el operador.",
    "Tus datos le llegan solo al operador del sitio por Telegram. No se guardan en este sitio ni se comparten públicamente.",
  ],
};

export const residentVolunteer = { en, es };
