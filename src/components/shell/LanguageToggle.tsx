"use client";

import { useLocale } from "@/i18n/LocaleProvider";

/**
 * The single language control, used on every page. Switching is pure client state: the provider
 * re-renders consumers without remounting them, so an in-progress review keeps its edits.
 */
export function LanguageToggle() {
  const { locale, setLocale, t } = useLocale();
  const target = locale === "en" ? "es" : "en";

  return (
    <button
      type="button"
      onClick={() => setLocale(target)}
      // The label repeats the visible text, so voice control can still say "Español".
      aria-label={t.languageToggle.ariaLabel}
      className="inline-flex min-h-11 items-center gap-1.5 rounded-control border border-line-field bg-surface px-2.5 text-sm font-medium text-ink hover:bg-chip"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        className="size-4 shrink-0 text-accent"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18" />
        <path d="M12 3c2.5 2.6 2.5 15.4 0 18C9.5 18.4 9.5 5.6 12 3Z" />
      </svg>
      {/* The text is in the language being offered, not the current one. */}
      <span lang={target}>{t.languageToggle.switchTo}</span>
    </button>
  );
}
