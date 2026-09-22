"use client";

import { useEffect, useRef, useState } from "react";
import { useResidentMap } from "@/components/ResidentMapContext";
import { useLocale } from "@/i18n/LocaleProvider";
import { residentMap } from "@/i18n/resident-map";
import { AAA_LINE } from "@/lib/contacts";
import type { Locale } from "@/lib/contracts";
import { MUNICIPALITY_CENTRES } from "@/lib/municipalities";
import { allCommunities, ommeContact } from "@/lib/plan";
import { normalize } from "@/lib/sites";

// Leaflet is loaded from CDN at runtime; we don't bundle its types.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Leaflet = any;

const LEAFLET_VERSION = "1.9.4";
const LEAFLET_CSS = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.css`;
const LEAFLET_JS = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.js`;

// Fit padding keeps markers clear of the overlays: sites button (top), location control (bottom).
const FIT = { paddingTopLeft: [24, 60], paddingBottomRight: [24, 64] };

/** A municipality marker means "this municipality" (its town centre), never a water point: calm blue, no ripple. */
export type MapFocus = { name: string; n: number };

const MARKER_HTML =
  '<div data-municipality-marker style="width:22px;height:22px;border-radius:9999px;background:#156fa8;' +
  'border:3px solid #fff;box-shadow:0 1px 6px rgba(15,23,42,.4);transition:transform .2s"></div>';

// Real device location (opt-in): a small dot, nothing else depends on it.
const USER_DOT_HTML =
  '<div style="width:14px;height:14px;border-radius:9999px;background:#0f172a;border:3px solid #fff;box-shadow:0 1px 6px rgba(15,23,42,.5)"></div>';

// Communities per municipality and zone, counted once from the notice's affected-area lists.
const ZONE_COUNTS: Record<string, { zone1: number; zone2: number }> = {};
for (const { municipality, zone } of allCommunities()) {
  (ZONE_COUNTS[municipality] ??= { zone1: 0, zone2: 0 })[zone] += 1;
}

const LINK_STYLE = "color:var(--color-action,#0284c7);font-weight:600;white-space:nowrap";
const telLink = (display: string, tel: string) => `<a href="tel:${tel}" style="${LINK_STYLE}">${display}</a>`;

// Inline styles: Leaflet popups render outside the page's font scope. Colours = ink/action/muted.
function popupHtml(name: string, locale: Locale): string {
  const t = residentMap[locale];
  const counts = ZONE_COUNTS[name] ?? { zone1: 0, zone2: 0 };
  const omme = (ommeContact(name)?.phones ?? [])
    .map((phone) => telLink(phone, `+1${phone.replace(/\D/g, "")}`))
    .join(" · ");
  return (
    `<div style="font:13px/1.5 var(--font-instrument-sans),system-ui,sans-serif;color:var(--color-ink,#0f172a)">` +
    `<div style="font-size:15px;font-weight:600">${name}</div>` +
    `<div style="color:var(--color-muted,#64748b)">${t.zoneCounts(counts.zone1, counts.zone2)}</div>` +
    (omme ? `<div style="margin-top:6px">${t.ommeLabel}: ${omme}</div>` : "") +
    `<div>${AAA_LINE.name}: ${telLink(AAA_LINE.display, AAA_LINE.tel)}</div>` +
    `<div style="margin-top:6px;font-size:12px;color:var(--color-muted,#64748b)">${t.typeCommunity}</div>` +
    `</div>`
  );
}

/** Load Leaflet from CDN once and resolve the global `L`. Avoids bundling a map dependency. */
function loadLeaflet(): Promise<Leaflet> {
  const w = window as unknown as { L?: unknown };
  if (w.L) return Promise.resolve(w.L);

  if (!document.querySelector(`link[data-leaflet]`)) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = LEAFLET_CSS;
    link.dataset.leaflet = "true";
    document.head.appendChild(link);
  }

  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[data-leaflet]`);
    if (existing) {
      existing.addEventListener("load", () => resolve((window as unknown as { L: unknown }).L));
      existing.addEventListener("error", reject);
      return;
    }
    const script = document.createElement("script");
    script.src = LEAFLET_JS;
    script.async = true;
    script.dataset.leaflet = "true";
    script.addEventListener("load", () => resolve((window as unknown as { L: unknown }).L));
    script.addEventListener("error", reject);
    document.body.appendChild(script);
  });
}

export function WaterMap({ focus }: { focus: MapFocus | null }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Leaflet>(null);
  const markersRef = useRef<Record<string, Leaflet>>({});
  const [ready, setReady] = useState(false);
  const [popupOpen, setPopupOpen] = useState(false);
  const { locale } = useLocale();
  const t = residentMap[locale];
  const { userLocation, locating, locationFailed, requestUserLocation, dismissLocationFailed } = useResidentMap();
  // Leaflet loads async: the marker loop reads the latest locale from a ref.
  const localeRef = useRef(locale);
  const userLat = userLocation?.lat;
  const userLng = userLocation?.lng;

  useEffect(() => {
    localeRef.current = locale;
    for (const { name } of MUNICIPALITY_CENTRES) markersRef.current[name]?.setPopupContent(popupHtml(name, locale));
  }, [locale]);

  useEffect(() => {
    let cancelled = false;
    let resizeObserver: ResizeObserver | undefined;
    loadLeaflet().then((L) => {
      if (cancelled || !containerRef.current || mapRef.current) return;

      // First view: the seven affected municipalities.
      const map = L.map(containerRef.current).fitBounds(
        L.latLngBounds(MUNICIPALITY_CENTRES.map((m) => [m.lat, m.lng])),
        { ...FIT, maxZoom: 12 },
      );
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      for (const { name, lat, lng } of MUNICIPALITY_CENTRES) {
        markersRef.current[name] = L.marker([lat, lng], {
          icon: L.divIcon({ className: "", html: MARKER_HTML, iconSize: [22, 22], iconAnchor: [11, 11], popupAnchor: [0, -10] }),
          title: name,
          alt: name,
          riseOnHover: true,
        })
          .addTo(map)
          .bindPopup(popupHtml(name, localeRef.current), {
            // Top padding keeps the popup clear of the sites button overlaid on the map.
            minWidth: 200,
            maxWidth: 260,
            autoPan: true,
            autoPanPaddingTopLeft: [8, 72],
            autoPanPaddingBottomRight: [8, 8],
          });
      }

      map.on("popupopen", () => setPopupOpen(true));
      map.on("popupclose", () => setPopupOpen(false));

      mapRef.current = map;
      // Keep tiles correct when the pane changes size (mobile split, panels opening).
      resizeObserver = new ResizeObserver(() => map.invalidateSize());
      resizeObserver.observe(containerRef.current);
      setReady(true);
    });
    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
    };
  }, []);

  // Focus (a chat answer names a municipality): fly to its marker and open the popup.
  // `focus` is a new object on every request, so asking for the same municipality re-flies.
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map || !focus) return;
    const target = MUNICIPALITY_CENTRES.find((m) => normalize(m.name) === normalize(focus.name));
    const marker = target && markersRef.current[target.name];
    if (!target || !marker) return;

    const dot = marker.getElement()?.querySelector("[data-municipality-marker]") as HTMLElement | null;
    if (dot) dot.style.transform = "scale(1.35)";
    marker.setZIndexOffset(600);
    // Open after the flight lands so Leaflet can auto-pan the whole popup into view.
    const open = () => marker.openPopup();
    map.once("moveend", open);
    map.flyTo([target.lat, target.lng], 12, { duration: 1 });
    return () => {
      map.off("moveend", open);
      if (dot) dot.style.transform = "";
      marker.setZIndexOffset(0);
    };
  }, [ready, focus]);

  // Device-location dot. Coordinates live in React state and this marker only: never stored, never logged.
  useEffect(() => {
    const map = mapRef.current;
    const L = (window as unknown as { L?: Leaflet }).L;
    if (!ready || !map || !L || userLat === undefined || userLng === undefined) return;
    const marker = L.marker([userLat, userLng], {
      icon: L.divIcon({ className: "", html: USER_DOT_HTML, iconSize: [14, 14], iconAnchor: [7, 7] }),
      zIndexOffset: 1000,
      alt: t.yourLocation,
    })
      .addTo(map)
      .bindTooltip(t.yourLocation, { direction: "top", offset: [0, -10] });
    return () => marker.remove();
  }, [ready, userLat, userLng, t.yourLocation]);

  return (
    <>
      <div ref={containerRef} role="region" aria-label={t.mapLabel} className="absolute inset-0 z-0 bg-chip" />

      {/* Bottom stack, above Leaflet's attribution line (zoom is top-left, the sites panel top-right). */}
      <div
        // Phones: the short map can't fit a popup above this stack.
        className={`pointer-events-none absolute inset-x-3 bottom-7 z-[1000] flex flex-col items-start gap-2 ${popupOpen ? "max-md:hidden" : ""}`}
      >
        {locationFailed && (
          <button
            type="button"
            onClick={dismissLocationFailed}
            aria-label={`${t.locationFailed} ${t.dismiss}`}
            className="pointer-events-auto max-w-xs rounded-card border border-review-line bg-review-soft px-3 py-1.5 text-left text-xs leading-snug break-words text-review shadow-card"
          >
            {t.locationFailed} <span aria-hidden="true">×</span>
          </button>
        )}

        {!userLocation && (
          <button
            type="button"
            disabled={locating}
            onClick={() =>
              void requestUserLocation().then(
                (found) => found && mapRef.current?.flyTo([found.lat, found.lng], 13, { duration: 1 }),
              )
            }
            className="pointer-events-auto inline-flex min-h-11 max-w-full items-center justify-center rounded-control border border-line bg-surface px-3 text-xs font-semibold text-action shadow-card hover:bg-action-soft disabled:opacity-60 sm:text-sm"
          >
            <span className="truncate">{locating ? t.locating : t.useMyLocation}</span>
          </button>
        )}
      </div>
    </>
  );
}
