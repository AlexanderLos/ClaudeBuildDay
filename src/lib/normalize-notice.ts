/**
 * Model output → reviewable notice. Pure and deterministic: same input, same output.
 *
 * This is the last gate before the coordinator sees anything. It only ever copies the fields
 * the contract names, so a `lat`/`lng` the model invented cannot survive even if the schema
 * ever stopped stripping it. It never fills in, guesses, or translates a missing value.
 */
import {
  deriveReviewStatus,
  type AffectedArea,
  type Confidence,
  type ExtractedNotice,
  type ExtractedResource,
  type InterruptionWindow,
  type ModelNotice,
  type ResidentInstruction,
  type SourceEvidence,
} from "./contracts";

/** Long enough to check a value against the page, short enough not to re-publish the notice. */
const MAX_QUOTE_LENGTH = 300;

function blankToNull(value: string | null): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeEvidence(evidence: SourceEvidence): SourceEvidence {
  const { page } = evidence;
  return {
    // A page reference the coordinator cannot turn to is worse than none.
    page: page !== null && Number.isInteger(page) && page > 0 ? page : null,
    quote: evidence.quote.trim().slice(0, MAX_QUOTE_LENGTH),
  };
}

/** Review metadata for one item. `hasValue` is whether its primary value survived trimming. */
function reviewMeta(
  hasValue: boolean,
  rawEvidence: SourceEvidence,
  confidence: Confidence,
) {
  const evidence = normalizeEvidence(rawEvidence);
  return {
    evidence,
    confidence,
    reviewStatus: deriveReviewStatus({ hasValue, evidence, confidence }),
    edited: false,
  };
}

export function normalizeNotice(model: ModelNotice): ExtractedNotice {
  const title = model.title.value.trim();
  const issuingOrganization = model.issuingOrganization.value.trim();
  const publicationDate = blankToNull(model.publicationDate.value);

  const affectedAreas: AffectedArea[] = [];
  for (const area of model.affectedAreas) {
    const municipality = area.municipality.trim();
    const communities = area.communities.map((name) => name.trim()).filter(Boolean);
    // Drop an item only when it carries nothing at all. A blank primary value with other facts
    // is kept and flagged "Needs review" so the coordinator never loses what the notice stated.
    if (municipality.length === 0 && communities.length === 0) continue;
    affectedAreas.push({
      id: `area-${affectedAreas.length}`,
      zone: blankToNull(area.zone),
      municipality,
      communities,
      ...reviewMeta(municipality.length > 0, area.evidence, area.confidence),
    });
  }

  const interruptionWindows: InterruptionWindow[] = [];
  for (const window of model.interruptionWindows) {
    const description = window.description.trim();
    const start = blankToNull(window.start);
    const end = blankToNull(window.end);
    if (description.length === 0 && start === null && end === null) continue;
    interruptionWindows.push({
      id: `window-${interruptionWindows.length}`,
      zone: blankToNull(window.zone),
      start,
      end,
      description,
      ...reviewMeta(description.length > 0 || start !== null, window.evidence, window.confidence),
    });
  }

  const resources: ExtractedResource[] = [];
  for (const resource of model.resources) {
    const name = resource.name.trim();
    const locationDescription = blankToNull(resource.locationDescription);
    if (name.length === 0 && locationDescription === null) continue;
    resources.push({
      id: `resource-${resources.length}`,
      name,
      locationDescription,
      hours: blankToNull(resource.hours),
      ...reviewMeta(name.length > 0, resource.evidence, resource.confidence),
    });
  }

  const residentInstructions: ResidentInstruction[] = [];
  for (const instruction of model.residentInstructions) {
    const text = instruction.text.trim();
    if (text.length === 0) continue;
    residentInstructions.push({
      id: `instruction-${residentInstructions.length}`,
      text,
      ...reviewMeta(true, instruction.evidence, instruction.confidence),
    });
  }

  return {
    title: {
      value: title,
      ...reviewMeta(title.length > 0, model.title.evidence, model.title.confidence),
    },
    issuingOrganization: {
      value: issuingOrganization,
      ...reviewMeta(
        issuingOrganization.length > 0,
        model.issuingOrganization.evidence,
        model.issuingOrganization.confidence,
      ),
    },
    publicationDate: {
      value: publicationDate,
      ...reviewMeta(
        publicationDate !== null,
        model.publicationDate.evidence,
        model.publicationDate.confidence,
      ),
    },
    affectedAreas,
    interruptionWindows,
    resources,
    residentInstructions,
  };
}
