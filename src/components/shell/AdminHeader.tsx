"use client";

import Link from "next/link";
import { useLocale } from "@/i18n/LocaleProvider";
import { LanguageToggle } from "./LanguageToggle";

/** Gradient header matching the resident (/) page. Replaces the old nav bar on /admin. */
export function AdminHeader() {
  const { t } = useLocale();

  return (
    <>
      {/* Skip link, revealed on focus. */}
      <a
        href="#main-content"
        className="absolute left-3 top-3 z-50 inline-flex min-h-11 -translate-y-24 items-center rounded-full bg-white px-4 text-sm font-medium text-sky-700 shadow transition-transform focus:translate-y-0"
      >
        {t.common.skipToContent}
      </a>

      <header className="bg-gradient-to-r from-sky-600 to-cyan-500 px-4 py-3 text-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 ring-1 ring-white/30">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                <path d="M12 2.5S5.5 9.5 5.5 14a6.5 6.5 0 0 0 13 0C18.5 9.5 12 2.5 12 2.5z" />
              </svg>
            </span>
            <div className="leading-tight">
              <h1 className="text-lg font-semibold tracking-tight">{t.common.appName}</h1>
              <p className="text-[11px] text-sky-50/90">{t.nav.coordinate}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium text-white ring-1 ring-white/25 transition hover:bg-white/25"
            >
              {t.nav.findWater}
            </Link>
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ring-white/30">
              Demo
            </span>
            <LanguageToggle />
          </div>
        </div>
      </header>
    </>
  );
}
