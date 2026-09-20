"use client";

import { CoordinateWorkspace } from "@/components/coordinate/CoordinateWorkspace";
import type { ExtractionResult } from "@/lib/extract-notice-client";
import { SAMPLE_NOTICE } from "@/lib/sample-notice";

// UI-only route: there is no extraction API on this branch, so extraction is faked with the
// sample notice. Like the real client, it rejects ONLY on abort so Cancel keeps working.
function fakeExtraction(_file: File, signal?: AbortSignal): Promise<ExtractionResult> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => resolve({ ok: true, notice: SAMPLE_NOTICE }), 1500);
    signal?.addEventListener("abort", () => {
      clearTimeout(timer);
      reject(signal.reason);
    });
  });
}

export function AdminWorkspace() {
  return <CoordinateWorkspace extractNotice={fakeExtraction} />;
}
