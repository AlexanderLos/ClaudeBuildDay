/** Review draft → published notice. Pure functions; `now` and `id` are injected for testability. */
import {
  PUBLISHED_SCHEMA_VERSION,
  type ExtractedNotice,
  type NoticeOrigin,
  type PublishedNotice,
  type PublishedResource,
  type ResourceApproval,
  type ReviewDraft,
} from "./contracts";
import { getCandidateById, suggestCoordinate } from "./curated-coordinates";

/** Initial approvals: each resource gets its suggested candidate (or none). Nothing starts approved. */
export function createReviewDraft(input: {
  notice: ExtractedNotice;
  origin: NoticeOrigin;
  sourceFileName: string | null;
}): ReviewDraft {
  const approvals: Record<string, ResourceApproval> = {};
  for (const resource of input.notice.resources) {
    approvals[resource.id] = {
      candidateId: suggestCoordinate(resource)?.id ?? null,
      approved: false,
    };
  }
  return { ...input, approvals };
}

/** Only explicitly approved resources whose candidate exists in the curated catalogue. */
export function selectMapResources(draft: ReviewDraft): PublishedResource[] {
  const mapResources: PublishedResource[] = [];
  for (const resource of draft.notice.resources) {
    const approval = draft.approvals[resource.id];
    if (!approval?.approved || approval.candidateId === null) continue;
    const candidate = getCandidateById(approval.candidateId);
    if (!candidate) continue;
    mapResources.push({
      id: `map-${resource.id}`,
      resourceId: resource.id,
      name: resource.name,
      locationDescription: resource.locationDescription,
      hours: resource.hours,
      lat: candidate.lat,
      lng: candidate.lng,
      coordinateSource: "curated_demo",
      candidateId: candidate.id,
      candidateName: candidate.name,
      evidence: resource.evidence,
      reviewStatus: resource.reviewStatus,
    });
  }
  return mapResources;
}

export function buildPublishedNotice(
  draft: ReviewDraft,
  options: { now: Date; id: string },
): PublishedNotice {
  return {
    schemaVersion: PUBLISHED_SCHEMA_VERSION,
    id: options.id,
    publishedAt: options.now.toISOString(),
    origin: draft.origin,
    sourceFileName: draft.sourceFileName,
    notice: draft.notice,
    mapResources: selectMapResources(draft),
  };
}
