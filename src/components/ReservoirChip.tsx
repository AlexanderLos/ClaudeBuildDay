"use client";

import { useEffect, useState } from "react";

import { useLocale } from "@/i18n/LocaleProvider";
import {
  USGS_PAGE_URL,
  bandGloss,
  formatLevel,
  formatObservedAt,
  type ReservoirReading,
  type ReservoirResponse,
} from "@/lib/reservoir";

/** Live Carraízo level from USGS. Takes no props; renders nothing while loading or on failure. */
export function ReservoirChip() {
  const { locale } = useLocale();
  const [reading, setReading] = useState<ReservoirReading | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/reservoir", { signal: controller.signal })
      .then((res) => res.json() as Promise<ReservoirResponse>)
      .then((data) => {
        if (data.ok) setReading(data);
      })
      .catch(() => {});
    return () => controller.abort();
  }, []);

  if (!reading) return null;

  const es = locale === "es";
  const title = [
    es
      ? "Lectura provisional en vivo del USGS (estación 50059000), en metros sobre el nivel medio del mar local."
      : "Live provisional USGS reading (station 50059000), in metres above local mean sea level.",
    reading.band &&
      (es
        ? `"${reading.band}" es la escala de niveles de la AAA aplicada a esta lectura del USGS.`
        : `"${reading.band}" (${bandGloss(reading.band)}) is AAA's level scale applied to this USGS reading.`),
    es
      ? "El nivel por sí solo no indica si hay o no racionamiento."
      : "The level does not by itself indicate whether rationing is on or off.",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <a
      href={USGS_PAGE_URL}
      target="_blank"
      rel="noopener noreferrer"
      title={title}
      className="inline-flex min-h-9 max-w-full items-center gap-1 rounded-control border border-line bg-surface px-3 text-sm text-ink"
    >
      <span className="truncate">
        Carraízo: {formatLevel(reading)}
        {reading.band && ` · ${reading.band}`}
        <span className="text-muted">
          {" · USGS"}
          <span className="hidden sm:inline">, {formatObservedAt(reading.observedAt, locale)}</span>
        </span>
      </span>
    </a>
  );
}
