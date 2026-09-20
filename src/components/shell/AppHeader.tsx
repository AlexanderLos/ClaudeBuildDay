"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "@/i18n/LocaleProvider";
import { LanguageToggle } from "./LanguageToggle";

/**
 * Client component because it reads the dictionary and the current route. It also carries the
 * skip link, which the root layout cannot render itself (a Server Component has no dictionary).
 */
export function AppHeader() {
  const { t } = useLocale();
  const pathname = usePathname();

  const links = [
    { href: "/", label: t.nav.findWater },
    { href: "/admin", label: t.nav.coordinate },
  ];

  return (
    <>
      {/* Parked above the viewport rather than `sr-only`, so focus reveals it without a reflow. */}
      <a
        href="#main-content"
        className="absolute left-3 top-3 z-50 inline-flex min-h-11 -translate-y-24 items-center rounded-control border border-line bg-surface px-4 text-sm font-medium text-ink shadow-card transition-transform focus:translate-y-0"
      >
        {t.common.skipToContent}
      </a>

      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-2 gap-y-1 px-3 py-2 sm:gap-x-3 sm:px-4">
          <Link
            href="/"
            className="mr-1 font-serif text-lg text-ink sm:text-xl"
          >
            {t.common.appName}
          </Link>

          {/* Wraps to its own row below 640px; the toggle stays at the top-right edge. */}
          <nav
            aria-label={t.nav.label}
            className="order-last w-full sm:order-none sm:w-auto"
          >
            <ul className="flex flex-wrap items-center gap-x-1">
              {links.map(({ href, label }) => {
                const active = pathname === href;
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      aria-current={active ? "page" : undefined}
                      className={
                        active
                          ? "inline-flex min-h-11 items-center rounded-control px-2 text-sm font-semibold text-action underline decoration-2 underline-offset-[6px]"
                          : "inline-flex min-h-11 items-center rounded-control px-2 text-sm font-medium text-muted hover:text-ink hover:underline hover:underline-offset-[6px]"
                      }
                    >
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <span className="ml-auto rounded-control bg-chip px-2 py-1 text-[11px] font-medium text-muted">
            {t.common.prototypeBadge}
          </span>
          <LanguageToggle />
        </div>
      </header>
    </>
  );
}
