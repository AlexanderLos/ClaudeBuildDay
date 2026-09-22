"use client";

import Link from "next/link";
import { LanguageToggle } from "@/components/shell/LanguageToggle";
import { useLocale } from "@/i18n/LocaleProvider";
import { residentMap } from "@/i18n/resident-map";

/** Header for the pages beside the map (/help, /volunteer): brand, a way back, language. */
export function SubpageHeader({ backLabel }: { backLabel: string }) {
  const { locale } = useLocale();
  return (
    <header className="flex min-h-14 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-line bg-surface px-4 py-1.5">
      <div className="flex items-baseline gap-3">
        <Link href="/" className="font-serif text-xl text-ink">
          {residentMap[locale].brand}
        </Link>
        <Link
          href="/"
          className="inline-flex min-h-11 items-center text-sm font-medium text-action hover:underline"
        >
          {backLabel}
        </Link>
      </div>
      <LanguageToggle />
    </header>
  );
}
