"use client";

import { useEffect, useRef } from "react";
import { SITES, siteColor, typeLabel } from "@/lib/sites";

// Leaflet is loaded from CDN at runtime; we don't bundle its types.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Leaflet = any;

const LEAFLET_VERSION = "1.9.4";
const LEAFLET_CSS = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.css`;
const LEAFLET_JS = `https://unpkg.com/leaflet@${LEAFLET_VERSION}/dist/leaflet.js`;

const MAP_CENTER: [number, number] = [18.405, -65.995];
const MAP_ZOOM = 12;

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

export function WaterMap({ focusId }: { focusId: string | null }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Leaflet>(null);
  const markersRef = useRef<Record<string, Leaflet>>({});

  useEffect(() => {
    let cancelled = false;
    loadLeaflet().then((L) => {
      if (cancelled || !containerRef.current || mapRef.current) return;

      const map = L.map(containerRef.current).setView(MAP_CENTER, MAP_ZOOM);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      for (const site of SITES) {
        const marker = L.circleMarker([site.lat, site.lng], {
          radius: site.recommended ? 11 : 8,
          color: "#ffffff",
          weight: 2,
          fillColor: siteColor(site),
          fillOpacity: 0.95,
        })
          .addTo(map)
          .bindPopup(
            `<strong>${site.name}</strong><br/>${typeLabel(site)} · ${site.municipality}<br/><span style="color:#555">${site.note}</span>`,
          );
        markersRef.current[site.id] = marker;
      }

      mapRef.current = map;
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !focusId) return;
    const site = SITES.find((s) => s.id === focusId);
    const marker = markersRef.current[focusId];
    if (site && marker) {
      map.flyTo([site.lat, site.lng], 15, { duration: 1.2 });
      marker.openPopup();
    }
  }, [focusId]);

  return <div ref={containerRef} className="h-full w-full" />;
}
