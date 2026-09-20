import type { Confidence, ErrorCode, ReviewStatus } from "@/lib/contracts";

/**
 * English dictionary and the source of the Dictionary shape (see ./index.ts).
 * Placeholders use {name} and are filled with `format()`.
 * Wording rules: never "verified", never a claim that water is available right now.
 */
export const en = {
  common: {
    appName: "Water Neighbor",
    prototypeBadge: "Prototype",
    demoDataBadge: "Demo data",
    skipToContent: "Skip to content",
  },
  nav: {
    label: "Main navigation",
    findWater: "Find water",
    coordinate: "Coordinate",
  },
  languageToggle: {
    /** Visible label: the language you would switch TO. */
    switchTo: "Español",
    ariaLabel: "Switch language to Español (Spanish)",
  },
  home: {
    heading: "Water Neighbor",
    tagline: "Clear, local water information drawn from official notices.",
    status: "Under construction",
    body: "The resident experience is coming next. Coordinators can already import an official notice.",
    coordinateCta: "Go to Coordinate",
  },
  coordinate: {
    pageTitle: "Import official notice",
    intro:
      "Upload the official notice as a PDF. Water Neighbor extracts communities, dates and locations for you to review before anything is published.",
    upload: {
      regionLabel: "Notice upload",
      dropTitle: "Drop the PDF here",
      dropOr: "or",
      chooseFile: "Choose a file",
      inputLabel: "Notice PDF",
      limits: "PDF only · up to 10 MB",
      dragActive: "Release to select this PDF",
      selectedLabel: "Selected file",
      removeFile: "Remove file",
      replaceFile: "Choose a different file",
      extract: "Extract notice",
      privacy: "The PDF is sent to Claude for extraction and is not stored by Water Neighbor.",
    },
    demo: {
      loadSample: "Load sample notice",
      note: "Loads invented sample data so you can try the review screen without a PDF. It is labelled “Demo data” everywhere.",
      resultNote: "This is sample data for demonstration. It did not come from a real notice.",
    },
    extracting: {
      title: "Reading the notice…",
      body: "Claude is extracting communities, dates and locations from the PDF. Long notices can take a few minutes.",
      keepOpen: "Keep this page open.",
      cancel: "Cancel extraction",
    },
    legend: {
      heading: "What the labels mean",
      matched:
        "Matched to notice: the value has a page and text reference you can check. It has not been independently confirmed.",
      needsReview:
        "Needs review: the reference is missing or the extraction was unsure. Check the notice and correct the value.",
    },
    review: {
      heading: "Review extracted information",
      subheading:
        "Check each section against the notice. Every value stays editable, and nothing is published until you approve it.",
      sourceFile: "Source file",
      summaryMatched: "Matched to notice: {count}",
      summaryNeedsReview: "Needs review: {count}",
      edited: "Edited by coordinator",
      evidenceLabel: "Source evidence",
      evidencePage: "Page {page}",
      evidenceNoPage: "Page not identified",
      evidenceNoQuote: "No supporting text was found in the notice",
      confidenceLabel: "Extraction confidence",
      notStated: "Not stated in the notice",
      sections: {
        title: "Notice title",
        issuingOrganization: "Issuing organization",
        publicationDate: "Publication date",
        affectedAreas: "Affected municipalities and communities",
        interruptionWindows: "Interruption dates",
        resources: "Official water locations",
        residentInstructions: "Resident instructions",
      },
      fields: {
        zone: "Zone or group",
        municipality: "Municipality",
        communities: "Communities",
        communitiesHint: "Separate communities with commas",
        start: "Starts",
        end: "Ends",
        windowDescription: "As written in the notice",
        resourceName: "Location name",
        locationDescription: "Address or description",
        hours: "Hours",
        instruction: "Instruction",
      },
      empty: {
        affectedAreas: "No affected areas were found in the notice.",
        interruptionWindows: "No interruption dates were found in the notice.",
        resources: "No water locations were found in the notice.",
        residentInstructions: "No resident instructions were found in the notice.",
      },
    },
    mapping: {
      heading: "Map placement",
      suggested: "Suggested match: {name}",
      curatedNote: "Curated demo coordinates. Not surveyed and not taken from the notice.",
      approve: "Approve for map",
      approved: "Approved for map",
      undo: "Undo approval",
      unmappable: "Exact location requires confirmation",
      unmappableHelp:
        "No curated coordinates match this location. It stays in the review list and will not appear on the map.",
    },
    publish: {
      button: "Approve and publish",
      note: "Only locations you approved with curated coordinates go on the map. Sections marked “Needs review” stay flagged.",
      noneApproved:
        "No locations are approved for the map yet. You can still publish the notice details.",
      startOver: "Start over",
    },
    published: {
      heading: "Notice published",
      body: "The reviewed notice was saved in this browser for the Find water page.",
      mapCount: "Locations published to the map: {count}",
      pendingCount: "Locations kept for confirmation, not on the map: {count}",
      flaggedCount: "Sections still marked “Needs review”: {count}",
      listedInNotice: "Listed in the official notice from {organization}",
      listedInDemo: "Listed in the demo sample notice",
      disclaimer:
        "Water Neighbor does not confirm that water is currently available at any location. Check the official notice for updates.",
      localOnly: "Saved only on this device. Nothing was sent to residents.",
      backHome: "Go to Find water",
      importAnother: "Import another notice",
    },
    errorPanel: {
      title: "We couldn’t process this notice",
      retry: "Try again",
      chooseAnother: "Choose a different file",
    },
  },
  status: {
    matched: "Matched to notice",
    needs_review: "Needs review",
  } satisfies Record<ReviewStatus, string>,
  confidence: {
    high: "High",
    medium: "Medium",
    low: "Low",
  } satisfies Record<Confidence, string>,
  errors: {
    invalid_form: "The upload could not be read. Choose the PDF again.",
    missing_file: "Choose a PDF to continue.",
    unsupported_type: "That file is not a PDF. Choose a file that ends in .pdf.",
    file_too_large: "That PDF is larger than 10 MB. Choose a smaller file.",
    not_configured:
      "Extraction is not configured on this server. Add ANTHROPIC_API_KEY to the environment and restart.",
    timeout: "The extraction took too long and was stopped. Try again.",
    malformed_output:
      "The extraction returned incomplete data, so nothing was loaded. Try again.",
    model_refusal: "Claude declined to process this document, so nothing was loaded.",
    not_a_notice:
      "This PDF does not look like a water service notice, so nothing was extracted.",
    upstream_bad_request:
      "Claude could not read this PDF. It may be password-protected, damaged, or too long.",
    upstream_auth:
      "The server’s Anthropic API key was rejected. Check ANTHROPIC_API_KEY and restart.",
    upstream_too_large: "This PDF is too large for Claude to process. Choose a smaller file.",
    rate_limited: "Claude is receiving too many requests right now. Wait a moment and try again.",
    upstream_unavailable: "Claude is temporarily unavailable. Try again in a moment.",
    unknown: "Something went wrong while extracting the notice. Try again.",
    network: "The request did not reach the server. Check your connection and try again.",
    storage_failed:
      "This browser blocked saving the notice, so it was not published. Check private browsing or storage settings.",
  } satisfies Record<ErrorCode, string>,
};
