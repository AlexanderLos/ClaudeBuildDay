/**
 * The whole coordinator workflow as one reducer.
 *
 * Errors and statuses are kept as CODES, never as sentences, so a language change re-translates
 * what is already on screen without another request. Nothing here touches the network or storage.
 */
import { suggestCoordinate } from "@/lib/curated-coordinates";
import { createReviewDraft } from "@/lib/publish";
import { SAMPLE_NOTICE } from "@/lib/sample-notice";
import type {
  AffectedArea,
  ErrorCode,
  ExtractedNotice,
  ExtractedResource,
  InterruptionWindow,
  PublishedNotice,
  ResidentInstruction,
  ReviewDraft,
  ReviewStatus,
} from "@/lib/contracts";

export type Phase = "upload" | "extracting" | "review" | "published";

export type WorkspaceState = {
  phase: Phase;
  /** The PDF the coordinator picked. Never logged, never rendered as HTML. */
  file: File | null;
  draft: ReviewDraft | null;
  published: PublishedNotice | null;
  error: ErrorCode | null;
};

export const initialState: WorkspaceState = {
  phase: "upload",
  file: null,
  draft: null,
  published: null,
  error: null,
};

export type WorkspaceAction =
  | { type: "selectFile"; file: File }
  | { type: "rejectFile"; code: ErrorCode }
  | { type: "extractStart" }
  | { type: "extractSucceeded"; notice: ExtractedNotice; fileName: string }
  | { type: "extractFailed"; code: ErrorCode }
  | { type: "extractCancelled" }
  | { type: "loadDemo" }
  | { type: "editTextField"; field: "title" | "issuingOrganization"; value: string }
  | { type: "editPublicationDate"; value: string | null }
  | { type: "editArea"; id: string; patch: Partial<Pick<AffectedArea, "zone" | "municipality" | "communities">> }
  | { type: "editWindow"; id: string; patch: Partial<Pick<InterruptionWindow, "zone" | "start" | "end" | "description">> }
  | { type: "editResource"; id: string; patch: Partial<Pick<ExtractedResource, "name" | "locationDescription" | "hours">> }
  | { type: "editInstruction"; id: string; patch: Pick<ResidentInstruction, "text"> }
  | { type: "toggleApproval"; id: string }
  | { type: "publishSucceeded"; published: PublishedNotice }
  | { type: "publishFailed" }
  | { type: "reset" };

/** Every reviewable thing the summary counts: the three top-level fields plus each list item. */
export function reviewableItems(notice: ExtractedNotice): { reviewStatus: ReviewStatus }[] {
  return [
    notice.title,
    notice.issuingOrganization,
    notice.publicationDate,
    ...notice.affectedAreas,
    ...notice.interruptionWindows,
    ...notice.resources,
    ...notice.residentInstructions,
  ];
}

// NoInfer keeps the narrower `patch` from driving inference; the list decides what T is.
function patchItem<T extends { id: string; edited: boolean }>(
  items: T[],
  id: string,
  patch: NoInfer<Partial<T>>,
): T[] {
  return items.map((item) => (item.id === id ? { ...item, ...patch, edited: true } : item));
}

function withNotice(
  state: WorkspaceState,
  update: (notice: ExtractedNotice) => ExtractedNotice,
): WorkspaceState {
  if (!state.draft) return state;
  return { ...state, draft: { ...state.draft, notice: update(state.draft.notice) } };
}

export function workspaceReducer(
  state: WorkspaceState,
  action: WorkspaceAction,
): WorkspaceState {
  switch (action.type) {
    case "selectFile":
      return { ...initialState, file: action.file };
    case "rejectFile":
      return { ...initialState, error: action.code };
    case "extractStart":
      return { ...state, phase: "extracting", error: null };
    case "extractSucceeded":
      return {
        ...state,
        phase: "review",
        error: null,
        draft: createReviewDraft({
          notice: action.notice,
          origin: "ai_extraction",
          sourceFileName: action.fileName,
        }),
      };
    case "extractFailed":
      // A failure never falls back to sample data: the coordinator sees the error and nothing else.
      return { ...state, phase: "upload", draft: null, error: action.code };
    case "extractCancelled":
      return { ...state, phase: "upload", error: null };
    case "loadDemo":
      return {
        ...initialState,
        phase: "review",
        draft: createReviewDraft({
          notice: SAMPLE_NOTICE,
          origin: "demo_sample",
          sourceFileName: null,
        }),
      };
    case "editTextField":
      return withNotice(state, (notice) => ({
        ...notice,
        [action.field]: { ...notice[action.field], value: action.value, edited: true },
      }));
    case "editPublicationDate":
      return withNotice(state, (notice) => ({
        ...notice,
        publicationDate: { ...notice.publicationDate, value: action.value, edited: true },
      }));
    case "editArea":
      return withNotice(state, (notice) => ({
        ...notice,
        affectedAreas: patchItem(notice.affectedAreas, action.id, action.patch),
      }));
    case "editWindow":
      return withNotice(state, (notice) => ({
        ...notice,
        interruptionWindows: patchItem(notice.interruptionWindows, action.id, action.patch),
      }));
    case "editInstruction":
      return withNotice(state, (notice) => ({
        ...notice,
        residentInstructions: patchItem(notice.residentInstructions, action.id, action.patch),
      }));
    case "editResource": {
      if (!state.draft) return state;
      const resources = patchItem(state.draft.notice.resources, action.id, action.patch);
      const approvals = { ...state.draft.approvals };
      const resource = resources.find((item) => item.id === action.id);
      // Name and location drive the curated suggestion, so an edit re-suggests and drops any
      // approval: a stale approval must never reach the map.
      if (resource && ("name" in action.patch || "locationDescription" in action.patch)) {
        approvals[action.id] = {
          candidateId: suggestCoordinate(resource)?.id ?? null,
          approved: false,
        };
      }
      return {
        ...state,
        draft: { ...state.draft, notice: { ...state.draft.notice, resources }, approvals },
      };
    }
    case "toggleApproval": {
      const approval = state.draft?.approvals[action.id];
      if (!state.draft || !approval || approval.candidateId === null) return state;
      return {
        ...state,
        draft: {
          ...state.draft,
          approvals: {
            ...state.draft.approvals,
            [action.id]: { ...approval, approved: !approval.approved },
          },
        },
      };
    }
    case "publishSucceeded":
      return { ...state, phase: "published", published: action.published, error: null };
    case "publishFailed":
      // Stay in review so nothing the coordinator reviewed is lost.
      return { ...state, error: "storage_failed" };
    case "reset":
      return initialState;
  }
}
