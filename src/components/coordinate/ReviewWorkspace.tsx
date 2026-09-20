"use client";

import type { Dispatch, ReactNode } from "react";
import { format } from "@/i18n";
import { useLocale } from "@/i18n/LocaleProvider";
import type { ErrorCode, ExtractedResource, ReviewDraft } from "@/lib/contracts";
import { getCandidateById } from "@/lib/curated-coordinates";
import { Field, ReviewItemCard } from "./ReviewItemCard";
import { reviewableItems, type WorkspaceAction } from "./workspace-state";

const BUTTON = "min-h-11 rounded-control px-4 py-2 text-base font-medium";
const PRIMARY = `${BUTTON} bg-action text-white hover:bg-action-hover`;
const SECONDARY = `${BUTTON} border border-line-field bg-surface text-ink hover:bg-chip`;

/** An empty control means "not stated in the notice", never an empty string. */
const orNull = (value: string) => (value === "" ? null : value);
const splitCommunities = (text: string) =>
  text
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part !== "");

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid min-w-0 gap-3">
      <h3 className="text-lg font-semibold text-ink">{title}</h3>
      {children}
    </section>
  );
}

function ItemList({ children }: { children: ReactNode }) {
  return <ul className="grid min-w-0 gap-3">{children}</ul>;
}

function Empty({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-card border border-line bg-surface p-4 text-muted">{children}</p>
  );
}

/**
 * Coordinates only ever come from the curated demo catalogue, and only after an explicit
 * approval. A resource with no curated match renders no approve control at all, so it can
 * never become a marker.
 */
function MapPlacement({
  resource,
  draft,
  dispatch,
}: {
  resource: ExtractedResource;
  draft: ReviewDraft;
  dispatch: Dispatch<WorkspaceAction>;
}) {
  const { t } = useLocale();
  const m = t.coordinate.mapping;
  const approval = draft.approvals[resource.id];
  const candidate = approval?.candidateId ? getCandidateById(approval.candidateId) : null;

  return (
    <div className="grid gap-2 rounded-control bg-chip p-3">
      <h4 className="text-sm font-semibold text-ink">{m.heading}</h4>
      {candidate === null ? (
        <>
          <p className="text-sm font-medium text-review">
            <span aria-hidden="true">▲ </span>
            <span>{m.unmappable}</span>
          </p>
          <p className="text-sm text-muted">{m.unmappableHelp}</p>
        </>
      ) : (
        <>
          <p className="text-sm text-ink">{format(m.suggested, { name: candidate.name })}</p>
          <p className="text-sm text-muted">{m.curatedNote}</p>
          {approval.approved && (
            <p className="text-sm font-medium text-action">
              <span aria-hidden="true">✓ </span>
              <span>{m.approved}</span>
            </p>
          )}
          <button
            type="button"
            aria-pressed={approval.approved}
            className={approval.approved ? SECONDARY : PRIMARY}
            onClick={() => dispatch({ type: "toggleApproval", id: resource.id })}
          >
            {approval.approved ? m.undo : m.approve}
          </button>
        </>
      )}
    </div>
  );
}

export function ReviewWorkspace({
  draft,
  error,
  dispatch,
  onPublish,
}: {
  draft: ReviewDraft;
  error: ErrorCode | null;
  dispatch: Dispatch<WorkspaceAction>;
  onPublish: () => void;
}) {
  const { t } = useLocale();
  const r = t.coordinate.review;
  const { notice } = draft;
  const items = reviewableItems(notice);
  const matched = items.filter((item) => item.reviewStatus === "matched").length;
  const approvedCount = Object.values(draft.approvals).filter(
    (approval) => approval.approved && approval.candidateId !== null,
  ).length;

  return (
    <div className="grid min-w-0 gap-6">
      <header className="grid min-w-0 gap-2">
        <h2 className="font-serif text-2xl text-ink">{r.heading}</h2>
        <p className="text-muted">{r.subheading}</p>
        {draft.origin === "demo_sample" ? (
          <div className="grid gap-1 rounded-card border border-review-line bg-review-soft p-3">
            <span className="w-fit rounded-control bg-review-mark px-2 py-0.5 text-sm font-semibold text-ink">
              {t.common.demoDataBadge}
            </span>
            <p className="text-sm text-review">{t.coordinate.demo.resultNote}</p>
          </div>
        ) : (
          draft.sourceFileName !== null && (
            <p className="wrap-anywhere text-sm text-muted">
              {r.sourceFile}: {draft.sourceFileName}
            </p>
          )
        )}
        <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink">
          <span>{format(r.summaryMatched, { count: matched })}</span>
          <span className="text-review">
            {format(r.summaryNeedsReview, { count: items.length - matched })}
          </span>
        </p>
      </header>

      <section className="grid gap-2 rounded-card border border-line bg-surface p-4">
        <h3 className="text-base font-semibold text-ink">{t.coordinate.legend.heading}</h3>
        <p className="text-sm text-muted">{t.coordinate.legend.matched}</p>
        <p className="text-sm text-muted">{t.coordinate.legend.needsReview}</p>
      </section>

      <Section title={r.sections.title}>
        <ReviewItemCard item={notice.title}>
          <Field
            id="notice-title"
            label={r.sections.title}
            value={notice.title.value}
            onChange={(value) => dispatch({ type: "editTextField", field: "title", value })}
          />
        </ReviewItemCard>
      </Section>

      <Section title={r.sections.issuingOrganization}>
        <ReviewItemCard item={notice.issuingOrganization}>
          <Field
            id="notice-organization"
            label={r.sections.issuingOrganization}
            value={notice.issuingOrganization.value}
            onChange={(value) =>
              dispatch({ type: "editTextField", field: "issuingOrganization", value })
            }
          />
        </ReviewItemCard>
      </Section>

      <Section title={r.sections.publicationDate}>
        <ReviewItemCard item={notice.publicationDate}>
          <Field
            id="notice-publication-date"
            label={r.sections.publicationDate}
            value={notice.publicationDate.value ?? ""}
            placeholder={r.notStated}
            onChange={(value) => dispatch({ type: "editPublicationDate", value: orNull(value) })}
          />
        </ReviewItemCard>
      </Section>

      <Section title={r.sections.affectedAreas}>
        {notice.affectedAreas.length === 0 ? (
          <Empty>{r.empty.affectedAreas}</Empty>
        ) : (
          <ItemList>
            {notice.affectedAreas.map((area) => (
              <li key={area.id} className="min-w-0">
                <ReviewItemCard item={area}>
                  <Field
                    id={`${area.id}-zone`}
                    label={r.fields.zone}
                    value={area.zone ?? ""}
                    placeholder={r.notStated}
                    onChange={(value) =>
                      dispatch({ type: "editArea", id: area.id, patch: { zone: orNull(value) } })
                    }
                  />
                  <Field
                    id={`${area.id}-municipality`}
                    label={r.fields.municipality}
                    value={area.municipality}
                    onChange={(value) =>
                      dispatch({ type: "editArea", id: area.id, patch: { municipality: value } })
                    }
                  />
                  <Field
                    id={`${area.id}-communities`}
                    label={r.fields.communities}
                    hint={r.fields.communitiesHint}
                    value={area.communities.join(", ")}
                    uncontrolled
                    multiline
                    onChange={(value) =>
                      dispatch({
                        type: "editArea",
                        id: area.id,
                        patch: { communities: splitCommunities(value) },
                      })
                    }
                  />
                </ReviewItemCard>
              </li>
            ))}
          </ItemList>
        )}
      </Section>

      <Section title={r.sections.interruptionWindows}>
        {notice.interruptionWindows.length === 0 ? (
          <Empty>{r.empty.interruptionWindows}</Empty>
        ) : (
          <ItemList>
            {notice.interruptionWindows.map((interruption) => (
              <li key={interruption.id} className="min-w-0">
                <ReviewItemCard item={interruption}>
                  <Field
                    id={`${interruption.id}-zone`}
                    label={r.fields.zone}
                    value={interruption.zone ?? ""}
                    placeholder={r.notStated}
                    onChange={(value) =>
                      dispatch({
                        type: "editWindow",
                        id: interruption.id,
                        patch: { zone: orNull(value) },
                      })
                    }
                  />
                  <Field
                    id={`${interruption.id}-start`}
                    label={r.fields.start}
                    value={interruption.start ?? ""}
                    placeholder={r.notStated}
                    onChange={(value) =>
                      dispatch({
                        type: "editWindow",
                        id: interruption.id,
                        patch: { start: orNull(value) },
                      })
                    }
                  />
                  <Field
                    id={`${interruption.id}-end`}
                    label={r.fields.end}
                    value={interruption.end ?? ""}
                    placeholder={r.notStated}
                    onChange={(value) =>
                      dispatch({ type: "editWindow", id: interruption.id, patch: { end: orNull(value) } })
                    }
                  />
                  <Field
                    id={`${interruption.id}-description`}
                    label={r.fields.windowDescription}
                    multiline
                    value={interruption.description}
                    onChange={(value) =>
                      dispatch({
                        type: "editWindow",
                        id: interruption.id,
                        patch: { description: value },
                      })
                    }
                  />
                </ReviewItemCard>
              </li>
            ))}
          </ItemList>
        )}
      </Section>

      <Section title={r.sections.resources}>
        {notice.resources.length === 0 ? (
          <Empty>{r.empty.resources}</Empty>
        ) : (
          <ItemList>
            {notice.resources.map((resource) => (
              <li key={resource.id} className="min-w-0">
                <ReviewItemCard item={resource}>
                  <Field
                    id={`${resource.id}-name`}
                    label={r.fields.resourceName}
                    value={resource.name}
                    onChange={(value) =>
                      dispatch({ type: "editResource", id: resource.id, patch: { name: value } })
                    }
                  />
                  <Field
                    id={`${resource.id}-location`}
                    label={r.fields.locationDescription}
                    value={resource.locationDescription ?? ""}
                    placeholder={r.notStated}
                    onChange={(value) =>
                      dispatch({
                        type: "editResource",
                        id: resource.id,
                        patch: { locationDescription: orNull(value) },
                      })
                    }
                  />
                  <Field
                    id={`${resource.id}-hours`}
                    label={r.fields.hours}
                    value={resource.hours ?? ""}
                    placeholder={r.notStated}
                    onChange={(value) =>
                      dispatch({
                        type: "editResource",
                        id: resource.id,
                        patch: { hours: orNull(value) },
                      })
                    }
                  />
                  <MapPlacement resource={resource} draft={draft} dispatch={dispatch} />
                </ReviewItemCard>
              </li>
            ))}
          </ItemList>
        )}
      </Section>

      <Section title={r.sections.residentInstructions}>
        {notice.residentInstructions.length === 0 ? (
          <Empty>{r.empty.residentInstructions}</Empty>
        ) : (
          <ItemList>
            {notice.residentInstructions.map((instruction) => (
              <li key={instruction.id} className="min-w-0">
                <ReviewItemCard item={instruction}>
                  <Field
                    id={`${instruction.id}-text`}
                    label={r.fields.instruction}
                    multiline
                    value={instruction.text}
                    onChange={(text) =>
                      dispatch({ type: "editInstruction", id: instruction.id, patch: { text } })
                    }
                  />
                </ReviewItemCard>
              </li>
            ))}
          </ItemList>
        )}
      </Section>

      <div className="sticky bottom-0 z-10 grid gap-2 rounded-card border border-line bg-surface p-4 pb-[max(1rem,env(safe-area-inset-bottom))] lg:static lg:pb-4">
        {approvedCount === 0 && (
          <p className="text-sm text-muted">{t.coordinate.publish.noneApproved}</p>
        )}
        <p className="text-sm text-muted">{t.coordinate.publish.note}</p>
        {error !== null && (
          <p
            role="alert"
            className="rounded-control border border-danger-line bg-danger-soft p-3 text-sm text-danger"
          >
            <span aria-hidden="true">▲ </span>
            {t.errors[error]}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <button type="button" className={PRIMARY} onClick={onPublish}>
            {t.coordinate.publish.button}
          </button>
          <button
            type="button"
            className={SECONDARY}
            onClick={() => dispatch({ type: "reset" })}
          >
            {t.coordinate.publish.startOver}
          </button>
        </div>
      </div>
    </div>
  );
}
