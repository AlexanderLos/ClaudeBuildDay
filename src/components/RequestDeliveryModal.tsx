"use client";

import { useEffect, useRef, useState } from "react";
import type { Site } from "@/lib/sites";

type Status = "form" | "loading" | "success";

/**
 * Dummy delivery-request modal. "Use current location" loads ~2s, shows success, then closes and
 * asks the map to draw a route (onRouteRequested). Address submit just shows success.
 */
export function RequestDeliveryModal({
  site,
  onClose,
  onRouteRequested,
}: {
  site: Site;
  onClose: () => void;
  onRouteRequested: (site: Site) => void;
}) {
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState<Status>("form");
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    const list = timers.current;
    return () => list.forEach((id) => clearTimeout(id));
  }, []);

  function useCurrentLocation() {
    setStatus("loading");
    const toSuccess = window.setTimeout(() => {
      setStatus("success");
      const thenRoute = window.setTimeout(() => onRouteRequested(site), 1300);
      timers.current.push(thenRoute);
    }, 2000);
    timers.current.push(toSuccess);
  }

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="request-title"
        className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="request-title" className="text-base font-semibold text-gray-900">
              Request delivery
            </h2>
            <p className="mt-0.5 text-xs text-gray-500">{site.name}</p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {status === "loading" && (
          <div className="mt-6 flex flex-col items-center gap-3 py-4">
            <svg className="h-8 w-8 animate-spin text-sky-600" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-90" fill="currentColor" d="M12 2a10 10 0 0 1 10 10h-4a6 6 0 0 0-6-6z" />
            </svg>
            <p className="text-sm text-gray-600">Finding your location…</p>
          </div>
        )}

        {status === "success" && (
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
            <svg viewBox="0 0 24 24" className="mt-0.5 h-5 w-5 shrink-0 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M20 6 9 17l-5-5" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-green-800">Delivery requested</p>
              <p className="mt-0.5 text-xs text-green-700">
                The {site.name} team will follow up. (Demo — no real request was sent.)
              </p>
            </div>
          </div>
        )}

        {status === "form" && (
          <form
            className="mt-4 space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              if (address.trim()) setStatus("success");
            }}
          >
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-gray-600">Your address</span>
              <input
                autoFocus
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                placeholder="Street, urbanización, or landmark"
                className="w-full rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-gray-800 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-500/30"
                aria-label="Your address"
              />
            </label>

            <button
              type="submit"
              disabled={!address.trim()}
              className="w-full rounded-full bg-gradient-to-br from-sky-600 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:from-sky-700 hover:to-cyan-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Request delivery
            </button>

            <div className="flex items-center gap-3 text-[11px] uppercase tracking-wide text-gray-400">
              <span className="h-px flex-1 bg-gray-200" />
              or
              <span className="h-px flex-1 bg-gray-200" />
            </div>

            <button
              type="button"
              onClick={useCurrentLocation}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-slate-50"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-sky-600" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 21s-7-6.4-7-11a7 7 0 1 1 14 0c0 4.6-7 11-7 11z" />
                <circle cx="12" cy="10" r="2.5" />
              </svg>
              Use current location
            </button>

            <p className="text-center text-[11px] text-gray-400">
              Your exact location stays private.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
