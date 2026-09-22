"use client";

import { useId, useState, type FormEvent } from "react";
import { useResidentMap } from "@/components/ResidentMapContext";
import type { ChatLocale, ChatResponse } from "@/lib/chat-contract";
import { AAA_LINE } from "@/lib/contacts";
import { roundApprox, type LatLng } from "@/lib/geo";

/**
 * Getting water brought to you. The PRIMARY path is a phone call to the municipal emergency office
 * (OMME, number from the notice). The form is secondary and labelled for what it is: a prototype
 * that sends one Telegram message to the Water Neighbor site operator. There is no volunteer
 * dispatch network; it never promises a delivery and never asks for an exact home address.
 * Strings live here because only this component uses them.
 */
const strings = {
  es: {
    callFirst:
      "¿Necesitas que te lleven agua? Llama a la oficina de manejo de emergencias de tu municipio: ellos coordinan la asistencia de agua.",
    open: "Enviar solicitud al operador del sitio",
    title: "Enviar solicitud al operador del sitio",
    pilot: "Prototipo · no es un servicio oficial de AAA ni del municipio",
    disclaimer:
      "Este prototipo envía tu solicitud por Telegram al operador del sitio Water Neighbor. No es un servicio oficial de AAA ni del municipio, y no existe una red de voluntarios para despachar agua.",
    noAddress: "No pedimos tu dirección exacta.",
    noPromise: "Enviar la solicitud no garantiza una entrega ni una respuesta.",
    name: "Nombre",
    phone: "Teléfono",
    community: "Comunidad o sector",
    municipality: "Municipio",
    needs: "En el hogar hay (opcional)",
    need: {
      baby: "Bebé",
      older_adult: "Adulto mayor",
      medical: "Persona encamada o condición médica",
      no_transport: "Sin transporte",
    },
    note: "Nota (opcional)",
    consent: "Autorizo que el operador del sitio Water Neighbor me llame a este número.",
    submit: "Enviar solicitud",
    submitting: "Enviando…",
    cancel: "Cancelar",
    errName: "Escribe tu nombre.",
    errPhone: "Escribe un teléfono de 10 dígitos, por ejemplo 787-555-1234.",
    errCommunity: "Escribe tu comunidad o sector.",
    errConsent: "Necesitamos tu autorización para llamarte.",
    sent: "Solicitud enviada al operador del sitio. Para ayuda real ahora, llama a",
    demoOnly: "Demostración solamente. No se enviará una solicitud real.",
    failed: "No pudimos enviar la solicitud. Intenta de nuevo.",
    failedCall: "Si es urgente, llama a",
    shareLocation: "Compartir mi ubicación aproximada (±100 m) con el operador del sitio (opcional)",
    locating: "Buscando tu ubicación…",
    locationReady: "Ubicación aproximada lista (±100 m)",
    locationFailed: "No pudimos obtener tu ubicación. Puedes enviar la solicitud sin ella.",
  },
  en: {
    callFirst:
      "Need water brought to you? Call your municipality's emergency office — they coordinate water assistance.",
    open: "Send a request to the site operator",
    title: "Send a request to the site operator",
    pilot: "Prototype · not an official AAA or municipal service",
    disclaimer:
      "This prototype sends your request to the Water Neighbor site operator by Telegram. It is not an official AAA or municipal service and there is no volunteer dispatch network.",
    noAddress: "We don't ask for your exact address.",
    noPromise: "Sending a request does not guarantee a delivery or a reply.",
    name: "First name",
    phone: "Phone",
    community: "Community or sector",
    municipality: "Municipality",
    needs: "In the household (optional)",
    need: {
      baby: "Baby",
      older_adult: "Older adult",
      medical: "Bedridden or medical condition",
      no_transport: "No transportation",
    },
    note: "Note (optional)",
    consent: "I agree that the Water Neighbor site operator may call me at this number.",
    submit: "Send request",
    submitting: "Sending…",
    cancel: "Cancel",
    errName: "Enter your first name.",
    errPhone: "Enter a 10-digit phone number, for example 787-555-1234.",
    errCommunity: "Enter your community or sector.",
    errConsent: "We need your permission to call you.",
    sent: "Request sent to the site operator. For real help now, call",
    demoOnly: "Demo only. No real request will be sent.",
    failed: "We couldn't send the request. Try again.",
    failedCall: "If it's urgent, call",
    shareLocation: "Share my approximate location (±100 m) with the site operator (optional)",
    locating: "Finding your location…",
    locationReady: "Approximate location ready (±100 m)",
    locationFailed: "We couldn't get your location. You can send the request without it.",
  },
} as const;

const NEEDS = ["baby", "older_adult", "medical", "no_transport"] as const;
type Field = "name" | "phone" | "community" | "consent";
type Status = "idle" | "submitting" | "error" | "sent" | "demo";

// `rounded-control` is a full pill: single-line buttons and inputs only. Anything that can wrap uses a card radius.
const BUTTON =
  "flex min-h-11 w-full items-center justify-center rounded-control px-4 py-2 text-center text-sm font-semibold break-words";
const FIELD =
  "w-full border border-line-field bg-surface text-sm text-ink placeholder:text-placeholder aria-[invalid=true]:border-danger";
const INPUT = `${FIELD} h-11 rounded-control px-4`;
const LABEL = "mb-1 block text-sm font-medium text-ink";
const CHECK_ROW = "flex cursor-pointer items-start gap-2.5 py-1 text-sm leading-snug text-ink";
const NOTICE = "rounded-xl border px-3 py-2.5 text-sm leading-snug break-words";

/** English on purpose: the operator's Telegram brief is in English whatever the resident's locale. */
function statusSummary({ status, simulated }: ChatResponse): string | undefined {
  if (!status) return undefined;
  if (status.kind === "outside_calendar") return "outside the published AAA calendar";
  if (status.kind === "plan_not_active") {
    return status.phase === "ended"
      ? `rationing ended (reported ${status.endedReportedOn}); no scheduled rotation`
      : "rationing paused; no scheduled rotation";
  }
  const state = `${simulated ? "replay: " : ""}${status.state === "with_service" ? "service on" : "no service"}`;
  if (!status.nextChangeAt) return `${state} (per the published AAA calendar)`;
  const until = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Puerto_Rico",
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(status.nextChangeAt));
  return `${state} until ${until} (per the published AAA calendar)`;
}

export function DeliveryRequest({
  response,
  locale,
}: {
  response: ChatResponse;
  locale: ChatLocale;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  // Optional, opt-in. Rounded to ±100 m BEFORE it is kept or sent; memory only.
  const [approx, setApprox] = useState<LatLng | "locating" | "failed" | null>(
    null,
  );
  const { requestUserLocation } = useResidentMap();

  if (response.needsClarification || !response.community) return null;

  const t = strings[locale];
  const telLink = (label: string, tel: string) => (
    <a href={`tel:${tel}`} className="inline-flex min-h-11 items-center font-semibold text-action underline underline-offset-2">
      {label}
    </a>
  );
  const phones = response.contact?.phones ?? [];
  const ommeTel = (phone: string) => `+1${phone.replace(/\D/g, "").slice(-10)}`;
  // Who to call for real help: the municipal office from the notice, else the AAA line.
  const omme =
    response.contact && phones[0]
      ? telLink(`${response.contact.agency} ${phones[0]}`, ommeTel(phones[0]))
      : telLink(`${AAA_LINE.name} ${AAA_LINE.display}`, AAA_LINE.tel);

  const done = status === "sent" || status === "demo";
  // One live region that stays mounted, so screen readers announce "sending" and then the result.
  const result = (
    <div role="status" aria-live="polite">
      {status === "submitting" && (
        <span className="sr-only">{t.submitting}</span>
      )}
      {done && (
        <p
          className={`${NOTICE} ${
            status === "sent"
              ? "border-success-line bg-success-soft text-success"
              : "border-line bg-chip text-muted"
          }`}
        >
          {status === "demo" ? t.demoOnly : <>{t.sent} {omme}.</>}
        </p>
      )}
    </div>
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const value = (key: string) => String(data.get(key) ?? "").trim();

    const found: Partial<Record<Field, string>> = {};
    if (!value("name")) found.name = t.errName;
    if (!/^1?[2-9]\d{9}$/.test(value("phone").replace(/\D/g, "")))
      found.phone = t.errPhone;
    if (!value("community")) found.community = t.errCommunity;
    if (!data.get("consent")) found.consent = t.errConsent;
    setErrors(found);
    const first = Object.keys(found)[0];
    if (first) {
      (form.elements.namedItem(first) as HTMLElement | null)?.focus();
      return;
    }

    const shared = approx && typeof approx === "object" ? approx : null;
    setStatus("submitting");
    try {
      const res = await fetch("/api/delivery-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale,
          name: value("name"),
          phone: value("phone"),
          community: value("community"),
          needs: data.getAll("needs"),
          note: value("note"),
          consent: true,
          municipality: response.municipality,
          zone: response.zone,
          noTransport: response.noTransport,
          simulated: response.simulated,
          statusSummary: statusSummary(response),
          ...(shared && { approxLocation: shared }),
        }),
      });
      const body = (await res.json()) as { ok?: boolean; delivered?: boolean; reason?: string };
      // "Demo only" is the honest fallback for ONE case: the server has no Telegram credentials.
      setStatus(
        !res.ok || !body.ok
          ? "error"
          : body.delivered
            ? "sent"
            : body.reason === "not_configured"
              ? "demo"
              : "error",
      );
    } catch {
      setStatus("error");
    }
  }

  const busy = status === "submitting";
  const field = (name: Field) => ({
    id: `${id}-${name}`,
    name,
    "aria-invalid": Boolean(errors[name]),
    "aria-describedby": errors[name] ? `${id}-${name}-error` : undefined,
  });
  const fieldError = (name: Field) =>
    errors[name] && (
      <p
        id={`${id}-${name}-error`}
        className="mt-1 text-xs font-medium text-danger"
      >
        {errors[name]}
      </p>
    );

  return (
    <div className="min-w-0">
      {/* Primary path: a phone call to the office that actually coordinates water assistance. */}
      <div className="rounded-xl border border-line bg-chip px-3 py-2 text-sm leading-snug break-words text-ink">
        <p>{t.callFirst}</p>
        <p className="flex flex-wrap items-center gap-x-3">
          {phones.length > 0 && response.contact
            ? phones.map((phone, index) => (
                <span key={phone}>{telLink(index === 0 ? `${response.contact?.agency} ${phone}` : phone, ommeTel(phone))}</span>
              ))
            : omme}
        </p>
      </div>
      {!done && (
        <>
          <button
            type="button"
            aria-expanded={open}
            aria-controls={`${id}-form`}
            onClick={() => setOpen(!open)}
            className={`${BUTTON} mt-2 border border-line-field bg-surface text-ink hover:bg-chip`}
          >
            {t.open}
          </button>
          {!open && (
            <p className="mt-1 text-center text-xs break-words text-muted">
              {t.pilot}
            </p>
          )}

          {/* `hidden` rather than unmounting: closing and reopening keeps what the resident typed. */}
          <form
            id={`${id}-form`}
            hidden={!open}
            noValidate
            onSubmit={submit}
            aria-labelledby={`${id}-title`}
            className="mt-3 space-y-3 rounded-card border border-line bg-surface p-4 text-sm text-ink"
          >
            <div>
              <h3 id={`${id}-title`} className="text-base font-semibold text-ink">
                {t.title}
              </h3>
              <p className="mt-0.5 text-xs leading-snug break-words text-muted">{t.disclaimer}</p>
            </div>

            <div>
              <label htmlFor={`${id}-name`} className={LABEL}>
                {t.name}
              </label>
              <input
                {...field("name")}
                type="text"
                autoComplete="given-name"
                maxLength={60}
                required
                className={INPUT}
              />
              {fieldError("name")}
            </div>

            <div>
              <label htmlFor={`${id}-phone`} className={LABEL}>
                {t.phone}
              </label>
              <input
                {...field("phone")}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                maxLength={30}
                placeholder="787-555-1234"
                required
                className={INPUT}
              />
              {fieldError("phone")}
            </div>

            <div>
              <label htmlFor={`${id}-community`} className={LABEL}>
                {t.community}
              </label>
              <input
                {...field("community")}
                type="text"
                defaultValue={response.community}
                maxLength={120}
                required
                className={INPUT}
              />
              {fieldError("community")}
              {response.municipality && (
                <p className="mt-1 text-xs text-muted">
                  {t.municipality}:{" "}
                  <span className="font-medium text-ink">
                    {response.municipality}
                  </span>
                </p>
              )}
            </div>

            <fieldset>
              <legend className={LABEL}>{t.needs}</legend>
              <div className="flex flex-wrap gap-2">
                {NEEDS.map((need) => (
                  <label
                    key={need}
                    className="flex min-h-11 cursor-pointer items-center gap-2 rounded-2xl border border-line-field bg-surface px-3 py-2 text-sm has-[:checked]:border-action has-[:checked]:bg-action-soft has-[:checked]:font-medium has-[:checked]:text-action"
                  >
                    <input
                      type="checkbox"
                      name="needs"
                      value={need}
                      defaultChecked={
                        need === "no_transport" && response.noTransport
                      }
                      className="size-4 shrink-0 accent-action"
                    />
                    {t.need[need]}
                  </label>
                ))}
              </div>
            </fieldset>

            <div>
              <label htmlFor={`${id}-note`} className={LABEL}>
                {t.note}
              </label>
              <textarea
                id={`${id}-note`}
                name="note"
                rows={2}
                maxLength={280}
                className={`${FIELD} block rounded-xl px-3 py-2`}
              />
            </div>

            <div>
              <label className={CHECK_ROW}>
                <input
                  type="checkbox"
                  aria-describedby={`${id}-location-status`}
                  onChange={async (event) => {
                    const box = event.currentTarget;
                    if (!box.checked) return setApprox(null);
                    setApprox("locating");
                    const found = await requestUserLocation();
                    // Unticked while we were waiting: keep nothing.
                    if (box.checked)
                      setApprox(found ? roundApprox(found) : "failed");
                  }}
                  className="mt-0.5 size-5 shrink-0 accent-action"
                />
                <span className="min-w-0 break-words">{t.shareLocation}</span>
              </label>
              <p
                id={`${id}-location-status`}
                role="status"
                className={`pl-[30px] text-xs font-medium break-words ${approx === "failed" ? "text-review" : "text-muted"}`}
              >
                {approx === "locating"
                  ? t.locating
                  : approx === "failed"
                    ? t.locationFailed
                    : approx
                      ? t.locationReady
                      : ""}
              </p>
            </div>

            <div>
              <label className={CHECK_ROW}>
                <input
                  {...field("consent")}
                  type="checkbox"
                  required
                  className="mt-0.5 size-5 shrink-0 accent-action"
                />
                <span className="min-w-0 break-words">{t.consent}</span>
              </label>
              {fieldError("consent")}
            </div>

            {status === "error" && (
              <p
                role="alert"
                className={`${NOTICE} border-danger-line bg-danger-soft text-danger`}
              >
                {t.failed} {t.failedCall} {omme}.
              </p>
            )}

            <div>
              <button
                type="submit"
                disabled={busy}
                className={`${BUTTON} bg-action text-white hover:bg-action-hover disabled:opacity-60`}
              >
                {busy ? t.submitting : t.submit}
              </button>
              <p className="mt-2 text-center text-xs leading-snug break-words text-muted">
                {t.noAddress} {t.noPromise}
              </p>
              <button
                type="button"
                disabled={busy}
                onClick={() => setOpen(false)}
                className="mx-auto mt-1 block min-h-11 px-4 text-sm font-medium text-muted underline-offset-4 hover:text-ink hover:underline"
              >
                {t.cancel}
              </button>
            </div>
          </form>
        </>
      )}
      <div className="mt-2">{result}</div>
    </div>
  );
}
