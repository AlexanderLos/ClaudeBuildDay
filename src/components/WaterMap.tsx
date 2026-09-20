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

// Demo "your location" — a spot in Isla Verde, Carolina.
const USER_LOCATION: [number, number] = [18.4443, -66.0203];

/** Road geometry from OSRM (free demo server) as [lat, lng][]; null if unavailable. */
async function fetchRoadRoute(
  from: [number, number],
  to: [number, number],
): Promise<[number, number][] | null> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const coords = data?.routes?.[0]?.geometry?.coordinates;
    if (!Array.isArray(coords) || coords.length === 0) return null;
    return coords.map(([lng, lat]: [number, number]) => [lat, lng]);
  } catch {
    return null;
  }
}

/** Curved (quadratic bezier) fallback so the line is never a straight segment. */
function curvedRoute(a: [number, number], b: [number, number]): [number, number][] {
  const [lat1, lng1] = a;
  const [lat2, lng2] = b;
  const mx = (lat1 + lat2) / 2;
  const my = (lng1 + lng2) / 2;
  const dLat = lat2 - lat1;
  const dLng = lng2 - lng1;
  const offset = 0.18;
  const cx = mx - dLng * offset;
  const cy = my + dLat * offset;
  const points: [number, number][] = [];
  for (let t = 0; t <= 1.0001; t += 0.05) {
    const lat = (1 - t) * (1 - t) * lat1 + 2 * (1 - t) * t * cx + t * t * lat2;
    const lng = (1 - t) * (1 - t) * lng1 + 2 * (1 - t) * t * cy + t * t * lng2;
    points.push([lat, lng]);
  }
  return points;
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

export function WaterMap({
  focusId,
  onRequestDelivery,
  routeSiteId,
}: {
  focusId: string | null;
  onRequestDelivery: (site: (typeof SITES)[number]) => void;
  routeSiteId: string | null;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Leaflet>(null);
  const markersRef = useRef<Record<string, Leaflet>>({});
  const routeLayerRef = useRef<Leaflet>(null);
  // Keep the latest callback so the map's one-time popupopen handler always calls current props.
  const onRequestRef = useRef(onRequestDelivery);
  useEffect(() => {
    onRequestRef.current = onRequestDelivery;
  }, [onRequestDelivery]);

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
            `<div style="min-width:200px">` +
              `<strong>${site.name}</strong><br/>${typeLabel(site)} · ${site.municipality}<br/>` +
              `<span style="color:#555">${site.note}</span>` +
              `<img src="${site.image}" alt="${site.name}" loading="lazy" ` +
              `style="margin-top:8px;width:100%;height:120px;object-fit:cover;border-radius:8px;display:block" />` +
              `<button class="request-delivery-btn" data-site-id="${site.id}" ` +
              `style="margin-top:10px;display:flex;width:100%;box-sizing:border-box;align-items:center;justify-content:center;gap:6px;` +
              `background:#1A86C6;color:#fff;border:none;border-radius:9999px;padding:8px 12px;font-size:12px;font-weight:600;cursor:pointer;">` +
              `Request delivery</button>` +
              `</div>`,
          );
        markersRef.current[site.id] = marker;
      }

      // Live "your location" marker (demo) in Isla Verde.
      L.marker(USER_LOCATION, {
        icon: L.divIcon({
          className: "",
          html: '<div class="user-location-dot"></div>',
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        }),
        zIndexOffset: 1000,
        keyboard: false,
      })
        .addTo(map)
        .bindPopup("You are here · Isla Verde");

      map.on("popupopen", (event: Leaflet) => {
        const button = event.popup.getElement()?.querySelector(".request-delivery-btn");
        if (!button) return;
        button.addEventListener(
          "click",
          () => {
            const site = SITES.find((s) => s.id === button.getAttribute("data-site-id"));
            if (site) onRequestRef.current(site);
          },
          { once: true },
        );
      });

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

  useEffect(() => {
    const map = mapRef.current;
    const L = (window as unknown as { L?: Leaflet }).L;
    if (!map || !L || !routeSiteId) return;
    const site = SITES.find((s) => s.id === routeSiteId);
    if (!site) return;

    let cancelled = false;
    (async () => {
      const to: [number, number] = [site.lat, site.lng];
      const path = (await fetchRoadRoute(USER_LOCATION, to)) ?? curvedRoute(USER_LOCATION, to);
      if (cancelled || !mapRef.current) return;

      if (routeLayerRef.current) routeLayerRef.current.remove();
      const line = L.polyline(path, {
        color: "#2563eb",
        weight: 4,
        opacity: 0.9,
        dashArray: "8 10",
        lineCap: "round",
        lineJoin: "round",
      }).addTo(map);
      routeLayerRef.current = line;

      map.flyToBounds(line.getBounds(), { padding: [60, 60], maxZoom: 16, duration: 1.6 });
    })();

    return () => {
      cancelled = true;
    };
  }, [routeSiteId]);

  return <div ref={containerRef} className="h-full w-full" />;
}
