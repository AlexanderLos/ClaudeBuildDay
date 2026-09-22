"use client";

import { useState, type ReactNode, type SyntheticEvent } from "react";
import { SubpageHeader } from "@/components/SubpageHeader";
import { useLocale } from "@/i18n/LocaleProvider";
import { residentVolunteer } from "@/i18n/resident-volunteer";
import { MUNICIPALITIES } from "@/lib/plan";

const FIELD =
  "w-full border border-line-field bg-surface text-sm text-ink placeholder:text-placeholder aria-[invalid=true]:border-danger";
const INPUT = `${FIELD} h-11 rounded-control px-4`;
const LABEL = "mb-1 block text-sm font-medium text-ink";
const HINT = "mt-1 text-xs leading-snug text-muted";
const CHIP =
  "flex min-h-11 cursor-pointer items-center gap-2 rounded-2xl border border-line-field bg-surface px-3 py-2 text-sm font-medium text-ink has-[:checked]:border-action has-[:checked]:bg-action-soft has-[:checked]:text-action";
const CHECK_ROW = "flex min-h-11 cursor-pointer items-center gap-2.5 text-sm leading-snug text-ink";

type Status =
  | { kind: "idle" | "submitting" }
  | { kind: "error"; message: string; fields: string[] }
  | { kind: "done"; name: string; delivered: boolean };

/** A labelled group of checkbox chips. Values are read from the form, so there is no state here. */
function ChipGroup({
  legend,
  name,
  options,
  invalid,
  error,
}: {
  legend: string;
  name: string;
  options: [value: string, label: string][];
  invalid: boolean;
  error: string;
}) {
  return (
    <fieldset>
      <legend className={LABEL}>{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map(([value, label]) => (
          <label key={value} className={CHIP}>
            <input type="checkbox" name={name} value={value} className="size-4 accent-action" />
            {label}
          </label>
        ))}
      </div>
      {invalid && <p className="mt-1 text-xs text-danger">{error}</p>}
    </fieldset>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className={LABEL}>{label}</span>
      {children}
      {hint && <span className={`${HINT} block`}>{hint}</span>}
    </label>
  );
}

/** /volunteer: what volunteering means here, then a sign-up that reaches the site operator. */
export function VolunteerPage() {
  const { locale } = useLocale();
  const t = residentVolunteer[locale];
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const bad = (field: string) => status.kind === "error" && status.fields.includes(field);

  async function submit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const body = {
      name,
      phone: form.get("phone"),
      telegram: form.get("telegram") ?? "",
      municipalities: form.getAll("municipalities"),
      help: form.getAll("help"),
      availability: form.getAll("availability"),
      languages: form.getAll("languages"),
      hasVehicle: form.get("hasVehicle") === "on",
      note: form.get("note") ?? "",
      consent: form.get("consent") === "on",
    };

    setStatus({ kind: "submitting" });
    try {
      const res = await fetch("/api/volunteer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => null)) as {
        ok?: boolean;
        delivered?: boolean;
        fields?: string[];
      } | null;
      if (res.ok && data?.ok) {
        setStatus({ kind: "done", name, delivered: data.delivered === true });
      } else {
        setStatus({
          kind: "error",
          message: res.status === 429 ? t.errorRate : res.status === 400 ? t.errorGeneric : t.errorNetwork,
          fields: data?.fields ?? [],
        });
      }
    } catch {
      setStatus({ kind: "error", message: t.errorNetwork, fields: [] });
    }
  }

  return (
    <>
      <SubpageHeader backLabel={t.back} />

      <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-10">
        <p className="text-sm font-semibold text-action">{t.eyebrow}</p>
        <h1 className="mt-1 font-serif text-3xl text-ink sm:text-4xl">{t.title}</h1>
        <p className="mt-3 max-w-2xl leading-relaxed text-muted">{t.intro}</p>
        <p className="mt-4 rounded-xl border border-success-line bg-success-soft px-4 py-3 text-sm leading-relaxed text-ink">
          {t.statusNote}
        </p>

        <section aria-labelledby="how" className="mt-8">
          <h2 id="how" className="text-lg font-semibold text-ink">
            {t.stepsTitle}
          </h2>
          <ol className="mt-3 grid gap-3 sm:grid-cols-3">
            {t.steps.map((step, index) => (
              <li key={step.title} className="rounded-card border border-line bg-surface p-4 shadow-card">
                <span className="flex size-7 items-center justify-center rounded-full bg-action-soft text-sm font-semibold text-action">
                  {index + 1}
                </span>
                <h3 className="mt-2 font-semibold text-ink">{step.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section
          aria-labelledby="signup"
          className="mt-8 rounded-card border border-line bg-surface p-5 shadow-card sm:p-6"
        >
          <h2 id="signup" className="text-lg font-semibold text-ink">
            {t.formTitle}
          </h2>

          {status.kind === "done" ? (
            <div role="status" className="mt-4 grid gap-3">
              <p className="rounded-xl border border-success-line bg-success-soft px-4 py-3 leading-relaxed text-ink">
                <strong className="font-semibold">{t.successTitle(status.name)}</strong>{" "}
                {status.delivered ? t.successBody : t.demoOnly}
              </p>
              <button
                type="button"
                onClick={() => setStatus({ kind: "idle" })}
                className="justify-self-start text-sm font-medium text-action hover:underline"
              >
                {t.again}
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-4 grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={t.name}>
                  <input
                    name="name"
                    required
                    maxLength={60}
                    autoComplete="given-name"
                    aria-invalid={bad("name")}
                    className={INPUT}
                  />
                </Field>
                <Field label={t.phone} hint={t.phoneHint}>
                  <input
                    name="phone"
                    type="tel"
                    required
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="787-555-1234"
                    aria-invalid={bad("phone")}
                    className={INPUT}
                  />
                </Field>
              </div>

              <Field label={t.telegram} hint={t.telegramHint}>
                <input
                  name="telegram"
                  maxLength={40}
                  placeholder="@username"
                  autoCapitalize="none"
                  spellCheck={false}
                  aria-invalid={bad("telegram")}
                  className={INPUT}
                />
              </Field>

              <ChipGroup
                legend={t.municipalities}
                name="municipalities"
                options={MUNICIPALITIES.map((name) => [name, name])}
                invalid={bad("municipalities")}
                error={t.pickOne}
              />
              <ChipGroup
                legend={t.help}
                name="help"
                options={Object.entries(t.helpOptions)}
                invalid={bad("help")}
                error={t.pickOne}
              />
              <label className={CHECK_ROW}>
                <input type="checkbox" name="hasVehicle" className="size-4 shrink-0 accent-action" />
                {t.vehicle}
              </label>
              <ChipGroup
                legend={t.languages}
                name="languages"
                options={Object.entries(t.languageOptions)}
                invalid={bad("languages")}
                error={t.pickOne}
              />
              <ChipGroup
                legend={t.availability}
                name="availability"
                options={Object.entries(t.availabilityOptions)}
                invalid={false}
                error=""
              />

              <Field label={t.note}>
                <textarea
                  name="note"
                  rows={3}
                  maxLength={280}
                  placeholder={t.notePlaceholder}
                  className={`${FIELD} rounded-xl px-4 py-2.5`}
                />
              </Field>

              <label className={CHECK_ROW}>
                <input
                  type="checkbox"
                  name="consent"
                  required
                  className="size-4 shrink-0 accent-action"
                />
                {t.consent}
              </label>

              {status.kind === "error" && (
                <p
                  role="alert"
                  className="rounded-xl border border-danger-line bg-danger-soft px-3 py-2.5 text-sm text-danger"
                >
                  {status.message}
                </p>
              )}

              <button
                type="submit"
                disabled={status.kind === "submitting"}
                className="inline-flex min-h-11 items-center justify-center rounded-control bg-action px-5 text-sm font-semibold text-white hover:bg-action-hover disabled:opacity-60 sm:justify-self-start"
              >
                {status.kind === "submitting" ? t.submitting : t.submit}
              </button>
            </form>
          )}
        </section>

        <section aria-labelledby="safety" className="mt-8">
          <h2 id="safety" className="text-lg font-semibold text-ink">
            {t.safetyTitle}
          </h2>
          <ul className="mt-2 grid list-disc gap-1.5 pl-5 text-sm leading-relaxed text-muted">
            {t.safety.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </section>
      </main>
    </>
  );
}
