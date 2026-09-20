import type { Dictionary } from "./index";

/** Spanish dictionary. Typed against the English shape, so a missing or extra key fails typecheck. */
export const es: Dictionary = {
  common: {
    appName: "Agua Vecina",
    prototypeBadge: "Prototipo",
    demoDataBadge: "Datos de demostración",
    skipToContent: "Saltar al contenido",
  },
  nav: {
    label: "Navegación principal",
    findWater: "Buscar agua",
    coordinate: "Coordinar",
  },
  languageToggle: {
    switchTo: "English",
    ariaLabel: "Cambiar idioma a English (inglés)",
  },
  home: {
    heading: "Agua Vecina",
    tagline: "Información de agua clara y cercana, tomada de avisos oficiales.",
    status: "En construcción",
    body: "La experiencia para residentes llegará pronto. Las personas coordinadoras ya pueden importar un aviso oficial.",
    coordinateCta: "Ir a Coordinar",
  },
  coordinate: {
    pageTitle: "Importar aviso oficial",
    intro:
      "Sube el aviso oficial en PDF. Agua Vecina extrae comunidades, fechas y lugares para que los revises antes de publicar.",
    upload: {
      regionLabel: "Carga del aviso",
      dropTitle: "Suelta el PDF aquí",
      dropOr: "o",
      chooseFile: "Elegir un archivo",
      inputLabel: "PDF del aviso",
      limits: "Solo PDF · hasta 10 MB",
      dragActive: "Suelta para seleccionar este PDF",
      selectedLabel: "Archivo seleccionado",
      removeFile: "Quitar archivo",
      replaceFile: "Elegir otro archivo",
      extract: "Extraer aviso",
      privacy: "El PDF se envía a Claude para la extracción y Agua Vecina no lo guarda.",
    },
    demo: {
      loadSample: "Cargar aviso de muestra",
      note: "Carga datos de muestra inventados para probar la pantalla de revisión sin un PDF. Siempre aparecen como «Datos de demostración».",
      resultNote: "Estos son datos de muestra para demostración. No provienen de un aviso real.",
    },
    extracting: {
      title: "Leyendo el aviso…",
      body: "Claude está extrayendo comunidades, fechas y lugares del PDF. Los avisos largos pueden tardar unos minutos.",
      keepOpen: "Mantén esta página abierta.",
      cancel: "Cancelar la extracción",
    },
    legend: {
      heading: "Qué significan las etiquetas",
      matched:
        "Coincide con el aviso: el valor tiene una referencia de página y texto que puedes comprobar. No se ha confirmado de forma independiente.",
      needsReview:
        "Requiere revisión: falta la referencia o la extracción no fue segura. Consulta el aviso y corrige el valor.",
    },
    review: {
      heading: "Revisar la información extraída",
      subheading:
        "Compara cada sección con el aviso. Todos los valores se pueden editar y nada se publica hasta que lo apruebes.",
      sourceFile: "Archivo de origen",
      summaryMatched: "Coincide con el aviso: {count}",
      summaryNeedsReview: "Requiere revisión: {count}",
      edited: "Editado por coordinación",
      evidenceLabel: "Evidencia de origen",
      evidencePage: "Página {page}",
      evidenceNoPage: "Página no identificada",
      evidenceNoQuote: "No se encontró texto de apoyo en el aviso",
      confidenceLabel: "Confianza de la extracción",
      notStated: "No se indica en el aviso",
      sections: {
        title: "Título del aviso",
        issuingOrganization: "Organización emisora",
        publicationDate: "Fecha de publicación",
        affectedAreas: "Municipios y comunidades afectadas",
        interruptionWindows: "Fechas de interrupción",
        resources: "Lugares oficiales de agua",
        residentInstructions: "Instrucciones para residentes",
      },
      fields: {
        zone: "Zona o grupo",
        municipality: "Municipio",
        communities: "Comunidades",
        communitiesHint: "Separa las comunidades con comas",
        start: "Comienza",
        end: "Termina",
        windowDescription: "Como aparece en el aviso",
        resourceName: "Nombre del lugar",
        locationDescription: "Dirección o descripción",
        hours: "Horario",
        instruction: "Instrucción",
      },
      empty: {
        affectedAreas: "No se encontraron áreas afectadas en el aviso.",
        interruptionWindows: "No se encontraron fechas de interrupción en el aviso.",
        resources: "No se encontraron lugares de agua en el aviso.",
        residentInstructions: "No se encontraron instrucciones para residentes en el aviso.",
      },
    },
    mapping: {
      heading: "Ubicación en el mapa",
      suggested: "Coincidencia sugerida: {name}",
      curatedNote:
        "Coordenadas curadas de demostración. No fueron medidas en el lugar ni provienen del aviso.",
      approve: "Aprobar para el mapa",
      approved: "Aprobado para el mapa",
      undo: "Deshacer aprobación",
      unmappable: "La ubicación exacta requiere confirmación",
      unmappableHelp:
        "Ninguna coordenada curada coincide con este lugar. Permanece en la lista de revisión y no aparecerá en el mapa.",
    },
    publish: {
      button: "Aprobar y publicar",
      note: "Solo los lugares que aprobaste con coordenadas curadas van al mapa. Las secciones marcadas «Requiere revisión» siguen señaladas.",
      noneApproved:
        "Todavía no hay lugares aprobados para el mapa. Aun así puedes publicar los detalles del aviso.",
      startOver: "Empezar de nuevo",
    },
    published: {
      heading: "Aviso publicado",
      body: "El aviso revisado se guardó en este navegador para la página Buscar agua.",
      mapCount: "Lugares publicados en el mapa: {count}",
      pendingCount: "Lugares pendientes de confirmación, fuera del mapa: {count}",
      flaggedCount: "Secciones aún marcadas «Requiere revisión»: {count}",
      listedInNotice: "Aparece en el aviso oficial de {organization}",
      listedInDemo: "Aparece en el aviso de muestra de demostración",
      disclaimer:
        "Agua Vecina no confirma que haya agua disponible en este momento en ningún lugar. Consulta el aviso oficial para ver actualizaciones.",
      localOnly: "Guardado solo en este dispositivo. No se envió nada a residentes.",
      backHome: "Ir a Buscar agua",
      importAnother: "Importar otro aviso",
    },
    errorPanel: {
      title: "No pudimos procesar este aviso",
      retry: "Intentar de nuevo",
      chooseAnother: "Elegir otro archivo",
    },
  },
  status: {
    matched: "Coincide con el aviso",
    needs_review: "Requiere revisión",
  },
  confidence: {
    high: "Alta",
    medium: "Media",
    low: "Baja",
  },
  errors: {
    invalid_form: "No se pudo leer la carga. Elige el PDF otra vez.",
    missing_file: "Elige un PDF para continuar.",
    unsupported_type: "Ese archivo no es un PDF. Elige un archivo que termine en .pdf.",
    file_too_large: "Ese PDF pesa más de 10 MB. Elige un archivo más pequeño.",
    not_configured:
      "La extracción no está configurada en este servidor. Añade ANTHROPIC_API_KEY al entorno y reinicia.",
    timeout: "La extracción tardó demasiado y se detuvo. Inténtalo de nuevo.",
    malformed_output:
      "La extracción devolvió datos incompletos, así que no se cargó nada. Inténtalo de nuevo.",
    model_refusal: "Claude declinó procesar este documento, así que no se cargó nada.",
    not_a_notice:
      "Este PDF no parece un aviso de servicio de agua, así que no se extrajo nada.",
    upstream_bad_request:
      "Claude no pudo leer este PDF. Puede estar protegido con contraseña, dañado o ser demasiado largo.",
    upstream_auth:
      "La clave de API de Anthropic del servidor fue rechazada. Revisa ANTHROPIC_API_KEY y reinicia.",
    upstream_too_large:
      "Este PDF es demasiado grande para que Claude lo procese. Elige un archivo más pequeño.",
    rate_limited:
      "Claude está recibiendo demasiadas solicitudes ahora mismo. Espera un momento e inténtalo de nuevo.",
    upstream_unavailable: "Claude no está disponible temporalmente. Inténtalo de nuevo en un momento.",
    unknown: "Algo salió mal al extraer el aviso. Inténtalo de nuevo.",
    network: "La solicitud no llegó al servidor. Revisa tu conexión e inténtalo de nuevo.",
    storage_failed:
      "Este navegador bloqueó el guardado del aviso, así que no se publicó. Revisa la navegación privada o los ajustes de almacenamiento.",
  },
};
