"use client";

import { useReducer, useRef } from "react";
import { useLocale } from "@/i18n/LocaleProvider";
import type { ErrorCode } from "@/lib/contracts";
import { requestExtraction } from "@/lib/extract-notice-client";
import { buildPublishedNotice } from "@/lib/publish";
import { savePublishedNotice } from "@/lib/storage";
import { PublishedPanel } from "./PublishedPanel";
import { ReviewWorkspace } from "./ReviewWorkspace";
import { UploadRail } from "./UploadRail";
import { initialState, workspaceReducer } from "./workspace-state";

const BUTTON = "min-h-11 rounded-control px-4 py-2 text-base font-medium";

/** Extraction failures only ever show the error. Sample data is never loaded in its place. */
function ErrorPanel({
  code,
  onRetry,
  onChooseAnother,
}: {
  code: ErrorCode;
  onRetry: (() => void) | null;
  onChooseAnother: () => void;
}) {
  const { t } = useLocale();
  return (
    <div
      role="alert"
      className="grid min-w-0 gap-3 rounded-panel border border-danger-line bg-danger-soft p-5"
    >
      <h2 className="text-lg font-semibold text-danger">
        <span aria-hidden="true">▲ </span>
        {t.coordinate.errorPanel.title}
      </h2>
      <p className="text-ink">{t.errors[code]}</p>
      <div className="flex flex-wrap gap-2">
        {onRetry && (
          <button
            type="button"
            className={`${BUTTON} bg-action text-white hover:bg-action-hover`}
            onClick={onRetry}
          >
            {t.coordinate.errorPanel.retry}
          </button>
        )}
        <button
          type="button"
          className={`${BUTTON} border border-line-field bg-surface text-ink hover:bg-chip`}
          onClick={onChooseAnother}
        >
          {t.coordinate.errorPanel.chooseAnother}
        </button>
      </div>
    </div>
  );
}

export function CoordinateWorkspace({
  extractNotice = requestExtraction,
}: {
  extractNotice?: typeof requestExtraction;
}) {
  const { t } = useLocale();
  const [state, dispatch] = useReducer(workspaceReducer, initialState);
  const abortRef = useRef<AbortController | null>(null);
  const { file } = state;

  async function extract(file: File) {
    const controller = new AbortController();
    abortRef.current = controller;
    dispatch({ type: "extractStart" });

    // requestExtraction only rejects on abort, so a null result means an unexpected throw.
    const result = await extractNotice(file, controller.signal).catch(() => null);
    // Cancelling already returned the UI to the selected file; a late answer must not undo that.
    if (controller.signal.aborted) return;
    if (result === null) {
      dispatch({ type: "extractFailed", code: "unknown" });
    } else if (result.ok) {
      dispatch({ type: "extractSucceeded", notice: result.notice, fileName: file.name });
    } else {
      dispatch({ type: "extractFailed", code: result.error.code });
    }
  }

  function publish() {
    if (!state.draft) return;
    const published = buildPublishedNotice(state.draft, {
      now: new Date(),
      id: crypto.randomUUID(),
    });
    dispatch(
      savePublishedNotice(window.localStorage, published)
        ? { type: "publishSucceeded", published }
        : { type: "publishFailed" },
    );
  }

  if (state.phase === "published" && state.published) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-6">
        <PublishedPanel
          published={state.published}
          onImportAnother={() => dispatch({ type: "reset" })}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6">
      <header className="grid max-w-2xl gap-2">
        <h1 className="font-serif text-3xl text-ink">{t.coordinate.pageTitle}</h1>
        <p className="text-muted">{t.coordinate.intro}</p>
      </header>

      <div className="mt-6 grid gap-4 lg:grid-cols-[400px_minmax(0,1fr)] lg:items-start">
        <UploadRail
          file={file}
          phase={state.phase}
          dispatch={dispatch}
          onExtract={() => file && extract(file)}
          onCancel={() => {
            abortRef.current?.abort();
            dispatch({ type: "extractCancelled" });
          }}
        />

        <div className="grid min-w-0 gap-4">
          {state.phase !== "review" && state.error !== null && (
            <ErrorPanel
              code={state.error}
              onRetry={file ? () => extract(file) : null}
              onChooseAnother={() => dispatch({ type: "reset" })}
            />
          )}
          {state.phase === "review" && state.draft && (
            <ReviewWorkspace
              draft={state.draft}
              error={state.error}
              dispatch={dispatch}
              onPublish={publish}
            />
          )}
        </div>
      </div>
    </div>
  );
}
