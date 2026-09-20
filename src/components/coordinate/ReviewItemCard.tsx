"use client";

import type { ReactNode } from "react";
import { format } from "@/i18n";
import { useLocale } from "@/i18n/LocaleProvider";
import type { ReviewStatus, TextField } from "@/lib/contracts";

/** The review metadata every extracted item carries. */
type ReviewMeta = Pick<TextField, "evidence" | "confidence" | "reviewStatus" | "edited">;

/**
 * Status is text + glyph, never colour alone. Amber is reserved for "Needs review"; a matched
 * value is blue, never green — "Matched to notice" means checkable, not confirmed.
 */
export function StatusChip({ status }: { status: ReviewStatus }) {
  const { t } = useLocale();
  const needsReview = status === "needs_review";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-control border px-2.5 py-1 text-sm font-medium ${
        needsReview
          ? "border-review-line bg-review-soft text-review"
          : "border-line bg-action-soft text-action"
      }`}
    >
      <span aria-hidden="true" className={needsReview ? "text-review-mark" : "text-accent"}>
        {needsReview ? "▲" : "●"}
      </span>
      <span>{t.status[status]}</span>
    </span>
  );
}

export function ReviewItemCard({ item, children }: { item: ReviewMeta; children: ReactNode }) {
  const { t } = useLocale();
  const r = t.coordinate.review;
  const { page, quote } = item.evidence;

  return (
    <div className="min-w-0 rounded-card border border-line bg-surface p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <StatusChip status={item.reviewStatus} />
        {item.edited && (
          <span className="inline-flex items-center gap-1.5 rounded-control border border-line bg-chip px-2.5 py-1 text-sm font-medium text-ink">
            <span aria-hidden="true">✎</span>
            <span>{r.edited}</span>
          </span>
        )}
      </div>

      <div className="grid gap-3">{children}</div>

      <div className="mt-4 border-t border-line pt-3 text-sm text-muted">
        <p className="font-medium text-ink">{r.evidenceLabel}</p>
        <p>{page === null ? r.evidenceNoPage : format(r.evidencePage, { page })}</p>
        {quote.trim() === "" ? (
          <p className="mt-1">{r.evidenceNoQuote}</p>
        ) : (
          <blockquote className="mt-1 rounded-control bg-chip px-3 py-2 wrap-anywhere text-ink">
            {quote}
          </blockquote>
        )}
        <p className="mt-2">
          {r.confidenceLabel}: {t.confidence[item.confidence]}
        </p>
      </div>
    </div>
  );
}

type FieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  placeholder?: string;
  multiline?: boolean;
  /**
   * Renders the control uncontrolled. Needed only where the typed text is transformed on the way
   * into state (comma-separated communities), so React never writes a re-joined value back and
   * eats the separator the coordinator is still typing.
   */
  uncontrolled?: boolean;
};

export function Field({
  id,
  label,
  value,
  onChange,
  hint,
  placeholder,
  multiline,
  uncontrolled,
}: FieldProps) {
  const bound: { value?: string; defaultValue?: string } = uncontrolled
    ? { defaultValue: value }
    : { value };
  const shared = {
    ...bound,
    id,
    placeholder,
    "aria-describedby": hint ? `${id}-hint` : undefined,
    className:
      "w-full min-w-0 rounded-control border border-line-field bg-surface px-3 py-2 text-ink placeholder:text-placeholder",
    onChange: (event: { target: { value: string } }) => onChange(event.target.value),
  };

  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-ink">
        {label}
      </label>
      {multiline ? <textarea rows={3} {...shared} /> : <input type="text" {...shared} />}
      {hint && (
        <p id={`${id}-hint`} className="mt-1 text-sm text-muted">
          {hint}
        </p>
      )}
    </div>
  );
}
