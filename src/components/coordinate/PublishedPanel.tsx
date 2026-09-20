"use client";

import Link from "next/link";
import { format } from "@/i18n";
import { useLocale } from "@/i18n/LocaleProvider";
import type { PublishedNotice } from "@/lib/contracts";
import { reviewableItems } from "./workspace-state";

const BUTTON = "min-h-11 rounded-control px-4 py-2 text-base font-medium";

/**
 * The only place green is allowed: the publication itself succeeded. The copy never says water
 * is available — only that the reviewed notice was saved on this device.
 */
export function PublishedPanel({
  published,
  onImportAnother,
}: {
  published: PublishedNotice;
  onImportAnother: () => void;
}) {
  const { t } = useLocale();
  const p = t.coordinate.published;
  const isDemo = published.origin === "demo_sample";
  const mapCount = published.mapResources.length;

  return (
    <div className="grid min-w-0 gap-4 rounded-panel border border-success-line bg-success-soft p-5">
      <div className="grid gap-2">
        <h2 className="font-serif text-2xl text-ink">
          <span aria-hidden="true" className="text-success">
            ✓{" "}
          </span>
          {p.heading}
        </h2>
        <p className="text-muted">{p.body}</p>
      </div>

      {isDemo && (
        <div className="grid gap-1 rounded-card border border-review-line bg-review-soft p-3">
          <span className="w-fit rounded-control bg-review-mark px-2 py-0.5 text-sm font-semibold text-ink">
            {t.common.demoDataBadge}
          </span>
          <p className="text-sm text-review">{t.coordinate.demo.resultNote}</p>
        </div>
      )}

      <ul className="grid gap-1 text-ink">
        <li>{format(p.mapCount, { count: mapCount })}</li>
        <li>
          {format(p.pendingCount, { count: published.notice.resources.length - mapCount })}
        </li>
        <li>
          {format(p.flaggedCount, {
            count: reviewableItems(published.notice).filter(
              (item) => item.reviewStatus === "needs_review",
            ).length,
          })}
        </li>
      </ul>

      {mapCount > 0 && (
        <section className="grid min-w-0 gap-2">
          <h3 className="text-base font-semibold text-ink">
            {t.coordinate.review.sections.resources}
          </h3>
          <ul className="grid min-w-0 gap-2">
            {published.mapResources.map((resource) => (
              <li
                key={resource.id}
                className="min-w-0 rounded-card border border-line bg-surface p-3"
              >
                <p className="font-medium wrap-anywhere text-ink">{resource.name}</p>
                <p className="text-sm wrap-anywhere text-muted">
                  {isDemo
                    ? p.listedInDemo
                    : format(p.listedInNotice, {
                        organization: published.notice.issuingOrganization.value,
                      })}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-sm text-muted">{p.disclaimer}</p>
      <p className="text-sm text-muted">{p.localOnly}</p>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/"
          className={`${BUTTON} inline-flex items-center bg-action text-white hover:bg-action-hover`}
        >
          {p.backHome}
        </Link>
        <button
          type="button"
          className={`${BUTTON} border border-line-field bg-surface text-ink hover:bg-chip`}
          onClick={onImportAnother}
        >
          {p.importAnother}
        </button>
      </div>
    </div>
  );
}
