"use client";

import { useRef, useState, type Dispatch, type DragEvent } from "react";
import { useLocale } from "@/i18n/LocaleProvider";
import { checkPdfMeta } from "@/lib/pdf-rules";
import type { Phase, WorkspaceAction } from "./workspace-state";

const BUTTON = "min-h-11 rounded-control px-4 py-2 text-base font-medium";
const PRIMARY = `${BUTTON} bg-action text-white hover:bg-action-hover`;
const SECONDARY = `${BUTTON} border border-line-field bg-surface text-ink hover:bg-chip`;

export function UploadRail({
  file,
  phase,
  dispatch,
  onExtract,
  onCancel,
}: {
  file: File | null;
  phase: Phase;
  dispatch: Dispatch<WorkspaceAction>;
  onExtract: () => void;
  onCancel: () => void;
}) {
  const { locale, t } = useLocale();
  const u = t.coordinate.upload;
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  // Written as the literal expression Next.js inlines at build time.
  const demoEnabled = process.env.NEXT_PUBLIC_ENABLE_DEMO_FALLBACK === "true";

  /** Client-side rules give fast feedback; the API enforces them again. */
  function accept(picked: File | undefined) {
    if (!picked) return;
    const violation = checkPdfMeta(picked);
    dispatch(
      violation ? { type: "rejectFile", code: violation } : { type: "selectFile", file: picked },
    );
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragActive(false);
    // Several files dropped at once: the first one wins.
    accept(event.dataTransfer.files[0]);
  }

  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  const sizeLabel =
    file === null
      ? ""
      : file.size >= 1024 * 1024
        ? `${number.format(file.size / 1024 / 1024)} MB`
        : `${number.format(file.size / 1024)} KB`;

  return (
    <section
      aria-label={u.regionLabel}
      className="grid min-w-0 gap-4 rounded-panel border border-line bg-surface p-4"
    >
      {file !== null ? (
        <div className="grid min-w-0 gap-2 rounded-card border border-line bg-canvas p-4">
          <p className="text-sm font-medium text-muted">{u.selectedLabel}</p>
          <p className="font-medium wrap-anywhere text-ink">{file.name}</p>
          <p className="text-sm text-muted">{sizeLabel}</p>
        </div>
      ) : phase === "upload" ? (
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={onDrop}
          className={`grid gap-3 rounded-card border-2 border-dashed p-6 text-center focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-action ${
            dragActive ? "border-action bg-action-soft" : "border-line-field bg-canvas"
          }`}
        >
          <p className="font-medium text-ink">{dragActive ? u.dragActive : u.dropTitle}</p>
          <p className="text-sm text-muted">{u.dropOr}</p>
          <label htmlFor="notice-pdf" className="sr-only">
            {u.inputLabel}
          </label>
          <input
            ref={inputRef}
            id="notice-pdf"
            type="file"
            accept="application/pdf,.pdf"
            className="sr-only"
            onChange={(event) => {
              accept(event.target.files?.[0]);
              // Allow re-picking the same file after removing it.
              event.target.value = "";
            }}
          />
          <button type="button" className={PRIMARY} onClick={() => inputRef.current?.click()}>
            {u.chooseFile}
          </button>
        </div>
      ) : null}

      {phase === "extracting" ? (
        <div className="grid gap-3">
          <div role="status" aria-live="polite" className="flex items-start gap-3">
            {/* Decorative: globals.css stops the animation under prefers-reduced-motion. */}
            <span
              aria-hidden="true"
              className="mt-1 size-5 shrink-0 animate-spin rounded-full border-2 border-line border-t-action"
            />
            <span className="min-w-0">
              <span className="block font-medium text-ink">{t.coordinate.extracting.title}</span>
              <span className="block text-sm text-muted">{t.coordinate.extracting.body}</span>
              <span className="block text-sm text-muted">{t.coordinate.extracting.keepOpen}</span>
            </span>
          </div>
          <button type="button" className={SECONDARY} onClick={onCancel}>
            {t.coordinate.extracting.cancel}
          </button>
        </div>
      ) : phase === "review" ? (
        <button type="button" className={SECONDARY} onClick={() => dispatch({ type: "reset" })}>
          {u.replaceFile}
        </button>
      ) : (
        file !== null && (
          <div className="flex flex-wrap gap-2">
            <button type="button" className={PRIMARY} onClick={onExtract}>
              {u.extract}
            </button>
            <button
              type="button"
              className={SECONDARY}
              onClick={() => dispatch({ type: "reset" })}
            >
              {u.removeFile}
            </button>
          </div>
        )
      )}

      <p className="text-sm text-muted">{u.limits}</p>
      <p className="text-sm text-muted">{u.privacy}</p>

      {demoEnabled && phase === "upload" && (
        <div className="grid gap-2 border-t border-line pt-4">
          <button
            type="button"
            className={SECONDARY}
            onClick={() => dispatch({ type: "loadDemo" })}
          >
            {t.coordinate.demo.loadSample}
          </button>
          <p className="text-sm text-muted">{t.coordinate.demo.note}</p>
        </div>
      )}
    </section>
  );
}
