"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/i18n/LocaleProvider";
import { residentMap } from "@/i18n/resident-map";
import { SOURCE_TITLE, allSupportLocations } from "@/lib/plan";
import type { SupportLocation } from "@/lib/chat-contract";

// Static notice data: group once by municipality.
const LOCATIONS = allSupportLocations();
const GROUPS = [...new Set(LOCATIONS.map((l) => l.municipality))]
  .sort((a, b) => a.localeCompare(b, "es"))
  .map((municipality): [string, SupportLocation[]] => [
    municipality,
    LOCATIONS.filter((l) => l.municipality === municipality),
  ]);

/**
 * The sites the notice names on its "Logística de Mitigación" page. A list, nothing more: AAA never
 * published their addresses, so there is no pin, no directions and no map link.
 */
export function SupportLocationsPanel() {
  const [open, setOpen] = useState(false);
  const { locale } = useLocale();
  const t = residentMap[locale];

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    // Top-right; Leaflet's zoom control is top-left, and the left inset keeps it uncovered on mobile.
    <div className="pointer-events-none absolute right-3 top-3 z-[1000] flex max-h-[calc(100%-1.5rem)] w-80 max-w-[calc(100%-4.5rem)] flex-col items-end">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="support-locations"
        onClick={() => setOpen((v) => !v)}
        className="pointer-events-auto inline-flex min-h-11 shrink-0 items-center gap-2 rounded-control border border-line bg-surface px-4 text-sm font-semibold text-action shadow-card hover:bg-action-soft"
      >
        {t.panelButton} ({LOCATIONS.length})
        <svg
          aria-hidden="true"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`size-3 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M2.5 4.5 6 8l3.5-3.5" />
        </svg>
      </button>

      {open && (
        <section
          id="support-locations"
          aria-label={t.panelButton}
          className="pointer-events-auto mt-2 flex min-h-0 w-full flex-col overflow-hidden rounded-panel border border-line bg-surface text-sm shadow-card"
        >
          <header className="border-b border-review-line bg-review-soft px-4 py-3">
            <p className="font-semibold text-review">{t.listedLabel}</p>
            <p className="mt-1 text-xs text-ink">{t.panelNote}</p>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-2">
            {GROUPS.map(([municipality, locations]) => (
              <div key={municipality} className="py-2">
                <h3 className="text-xs font-semibold text-muted">{municipality}</h3>
                <ul className="divide-y divide-line">
                  {locations.map((loc) => (
                    <li key={loc.id} className="py-2">
                      <p className="font-medium text-ink">{loc.name}</p>
                      <p className="text-xs text-muted">
                        {loc.municipality} · {t.listedHours}: {loc.listedHours}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <footer className="border-t border-line px-4 py-2 text-xs text-muted">
            {t.source}: {SOURCE_TITLE} · {t.page} 17
          </footer>
        </section>
      )}
    </div>
  );
}
