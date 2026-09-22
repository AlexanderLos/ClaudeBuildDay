"use client";

import Link from "next/link";
import { SubpageHeader } from "@/components/SubpageHeader";
import { useLocale } from "@/i18n/LocaleProvider";
import { HELP_ORGS, residentHelp } from "@/i18n/resident-help";

const BUTTON =
  "inline-flex min-h-11 items-center justify-center rounded-control px-4 text-sm font-semibold";

/** /help: a short, hand-checked list of organizations people can visit and support. */
export function HelpPage() {
  const { locale } = useLocale();
  const t = residentHelp[locale];

  return (
    <>
      <SubpageHeader backLabel={t.back} />

      <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-10">
        <h1 className="font-serif text-3xl text-ink sm:text-4xl">{t.title}</h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-muted">{t.intro}</p>

        <ul className="mt-8 grid gap-4">
          {HELP_ORGS.map((org) => (
            <li
              key={org.name}
              className="rounded-card border border-line bg-surface p-5 shadow-card"
            >
              <h2 className="text-lg font-semibold text-ink">{org.name}</h2>
              <p className="mt-1.5 leading-relaxed text-ink">{org.what[locale]}</p>
              <p className="mt-2 text-sm text-muted">{t.listedBy[org.listedBy]}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  href={org.donateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${BUTTON} bg-action text-white hover:bg-action-hover`}
                >
                  {t.donate}
                  <span className="sr-only"> — {org.name}</span>
                </a>
                {org.url !== org.donateUrl && (
                  <a
                    href={org.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${BUTTON} border border-line-field bg-surface text-ink hover:bg-chip`}
                  >
                    {t.visit} ↗<span className="sr-only"> — {org.name}</span>
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>

        <section className="mt-8 rounded-card border border-line bg-surface p-5 shadow-card">
          <h2 className="text-lg font-semibold text-ink">{t.volunteer}</h2>
          <p className="mt-1 text-muted">{t.volunteerBody}</p>
          <Link
            href="/volunteer"
            className={`${BUTTON} mt-3 border border-line-field bg-surface text-ink hover:bg-chip`}
          >
            {t.volunteerCta}
          </Link>
        </section>

        <section className="mt-4 rounded-card border border-line bg-action-soft p-5">
          <h2 className="text-lg font-semibold text-ink">{t.needWater}</h2>
          <p className="mt-1 text-muted">{t.needWaterBody}</p>
          <Link href="/" className={`${BUTTON} mt-3 bg-action text-white hover:bg-action-hover`}>
            {t.needWaterCta}
          </Link>
        </section>

        <p className="mt-8 text-sm leading-relaxed text-muted">{t.disclaimer}</p>
      </main>
    </>
  );
}
