"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ResultCard } from "@/components/ResultCard";
import { useLocale } from "@/i18n/LocaleProvider";
import { residentChat } from "@/i18n/resident-chat";
import type { ChatRequest, ChatResponse } from "@/lib/chat-contract";
import { normalizePlaceText } from "@/lib/curated-coordinates";
import { allCommunities } from "@/lib/plan";

/** A bot turn keeps the whole response so its card re-renders when the locale changes; null = request failed. */
type Message = { role: "user"; text: string } | { role: "bot"; response: ChatResponse | null };

// Search form of each official name: " urb villa carolina " — the leading space makes a match start on a
// word, so "villa car" hits both the full name and the prefix-stripped key ("Villa Carolina").
const COMMUNITIES = allCommunities().map((c) => ({ ...c, search: ` ${normalizePlaceText(c.community)} ` }));
const MAX_SUGGESTIONS = 6;

/**
 * Communities matching the longest trailing fragment (1–4 words, ≥ 3 chars) of what is typed, so
 * "Vivo en villa car" suggests Urb. Villa Carolina. Names that START with the fragment come first.
 * ponytail: linear scan of ~300 names per keystroke; index it if the notice ever lists thousands.
 */
function suggestCommunities(input: string) {
  const words = normalizePlaceText(input).split(" ").filter(Boolean);
  for (let start = Math.max(0, words.length - 4); start < words.length; start += 1) {
    const fragment = words.slice(start).join(" ");
    if (fragment.length < 3) break;
    const hits = COMMUNITIES.filter((c) => c.search.includes(` ${fragment}`));
    if (hits.length === 0) continue;
    const rank = (c: (typeof COMMUNITIES)[number]) => (c.search.startsWith(` ${fragment}`) ? 0 : 1);
    return hits.sort((a, b) => rank(a) - rank(b)).slice(0, MAX_SUGGESTIONS);
  }
  return [];
}

const BUBBLE = "max-w-[88%] rounded-card px-4 py-3 text-[15px] leading-relaxed break-words whitespace-pre-line";
const BOT_BUBBLE = `${BUBBLE} border border-line bg-surface text-ink`;

export function WaterChat({
  simulateDate,
  replayDate,
  onFocusAction,
}: {
  /** True = replay: answers come from the published calendar as of `replayDate`, never today's status. */
  simulateDate: boolean;
  /** YYYY-MM-DD; only sent in replay mode. */
  replayDate?: string;
  /** The map shows municipality markers: called with the answer's municipality. */
  onFocusAction?: (municipality: string) => void;
}) {
  const { locale, setLocale } = useLocale();
  const t = residentChat[locale];
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  // Autocomplete is closed while the input still starts with this text (set by picking or Escape),
  // so the rest of the sentence ("…, no tengo carro") does not reopen it.
  const [closedFor, setClosedFor] = useState<string | null>(null);
  const [active, setActive] = useState(-1);
  const listRef = useRef<HTMLDivElement>(null);
  const lastRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();
  const started = messages.length > 0;

  // Derived during render, never stored: the list always reflects the current input.
  const matches = pending || (closedFor !== null && input.startsWith(closedFor)) ? [] : suggestCommunities(input);
  const open = matches.length > 0;
  const activeIndex = active < matches.length ? active : -1;

  function pick(match: (typeof matches)[number]) {
    const sentence = t.autocomplete.fill
      .replace("{community}", match.community)
      .replace("{municipality}", match.municipality);
    setInput(sentence);
    setClosedFor(sentence);
    setActive(-1);
    inputRef.current?.focus(); // not sent: the resident can add "no tengo carro" or just press send
  }

  // Bring the START of the newest message to the top of the list, so a tall result card begins
  // with its bubble. Only the list scrolls: scrollIntoView would also drag the page on mobile,
  // where the chat is the bottom half of the screen. Rects are measured after the next frame so
  // a locale switch triggered by the same response has already re-laid-out the cards.
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const list = listRef.current;
      const last = lastRef.current;
      if (!list || !last) return;
      const delta = last.getBoundingClientRect().top - list.getBoundingClientRect().top - 12;
      list.scrollTo({ top: list.scrollTop + delta, behavior: "smooth" });
    });
    return () => cancelAnimationFrame(frame);
  }, [messages.length]);

  async function send(raw: string) {
    const text = raw.trim();
    if (!text || pending) return;

    // Last 10 only: /api/chat rejects a longer history with 400, which would break every later turn.
    const previousUserMessages = messages.flatMap((m) => (m.role === "user" ? [m.text] : [])).slice(-10);
    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");
    setClosedFor(null);
    setActive(-1);
    setPending(true);

    const body: ChatRequest = {
      message: text,
      locale,
      simulateDate,
      ...(simulateDate && replayDate && { replayDate }),
      previousUserMessages,
    };
    let response: ChatResponse | null = null;
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) response = (await res.json()) as ChatResponse;
    } catch {
      // response stays null: the error bubble renders
    }

    if (response) {
      // The whole screen follows the language the resident typed in.
      if ((response.locale === "es" || response.locale === "en") && response.locale !== locale) {
        setLocale(response.locale);
      }
      if (response.municipality) onFocusAction?.(response.municipality);
    }
    setMessages((prev) => [...prev, { role: "bot", response }]);
    setPending(false);
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-canvas">
      <div
        ref={listRef}
        className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4"
        aria-live="polite"
      >
        <div className="flex justify-start">
          <div className={BOT_BUBBLE}>{t.greeting}</div>
        </div>

        {messages.map((message, index) => (
          <div key={index} ref={index === messages.length - 1 ? lastRef : undefined}>
            {message.role === "user" ? (
              <div className="flex justify-end">
                <div className={`${BUBBLE} bg-action text-white`}>{message.text}</div>
              </div>
            ) : (
              <>
                <div className="flex justify-start">
                  <div
                    className={message.response ? BOT_BUBBLE : `${BUBBLE} border border-danger-line bg-danger-soft text-danger`}
                  >
                    {message.response ? message.response.answer : t.error}
                  </div>
                </div>
                {message.response && <ResultCard response={message.response} locale={locale} />}
                {/* Answers to the question just asked; gone as soon as the resident sends anything. */}
                {index === messages.length - 1 && !pending && (message.response?.quickReplies?.length ?? 0) > 0 && (
                  <div role="group" aria-label={t.quickRepliesLabel} className="mt-2 flex flex-wrap gap-2">
                    {message.response?.quickReplies?.map((reply) => (
                      <button
                        key={reply}
                        type="button"
                        onClick={() => void send(reply)}
                        className="min-h-11 rounded-2xl bg-chip px-3 py-2 text-left text-sm break-words text-muted hover:bg-action-soft hover:text-ink"
                      >
                        {reply}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        ))}

        {pending && (
          <div className="flex justify-start">
            <div className={`${BUBBLE} animate-pulse border border-line bg-surface text-muted`}>{t.pending}</div>
          </div>
        )}
      </div>

      <div className="border-t border-line bg-surface">
        {/* Not a native <datalist>: it replaces the whole input value and is inconsistent on mobile Safari. */}
        {open && (
          <ul
            id={listboxId}
            role="listbox"
            aria-label={t.autocomplete.label}
            className="max-h-36 overflow-y-auto overscroll-contain border-b border-line px-2 py-1"
          >
            {matches.map((match, index) => (
              <li
                key={`${match.community}|${match.municipality}`}
                id={`${listboxId}-${index}`}
                role="option"
                aria-selected={index === activeIndex}
                onMouseDown={(event) => event.preventDefault()} // keep focus (and the phone keyboard) on the input
                onClick={() => pick(match)}
                className={`flex min-h-11 cursor-pointer items-center rounded-xl px-3 text-sm break-words text-ink hover:bg-action-soft ${
                  index === activeIndex ? "bg-action-soft" : ""
                }`}
              >
                <span className="min-w-0">
                  {match.community} <span className="text-muted">· {match.municipality}</span>
                </span>
              </li>
            ))}
          </ul>
        )}

        {!started && !open && (
          <div
            role="group"
            aria-label={t.suggestionsLabel}
            className="flex gap-2 overflow-x-auto px-4 pt-3 md:flex-wrap md:overflow-visible"
          >
            {t.suggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => void send(suggestion)}
                className="min-h-11 shrink-0 rounded-2xl bg-chip px-3 py-2 text-left text-sm text-muted hover:bg-action-soft hover:text-ink md:shrink"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        <form
          className="flex gap-2 p-4"
          onSubmit={(event) => {
            event.preventDefault();
            void send(input);
          }}
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              setActive(-1);
            }}
            onKeyDown={(event) => {
              if (!open) return;
              if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                event.preventDefault();
                const step = event.key === "ArrowDown" ? 1 : -1;
                const next = activeIndex < 0 && step < 0 ? matches.length - 1 : (activeIndex + step + matches.length) % matches.length;
                setActive(next);
                document.getElementById(`${listboxId}-${next}`)?.scrollIntoView({ block: "nearest" });
              } else if (event.key === "Enter" && activeIndex >= 0) {
                event.preventDefault(); // pick instead of send
                pick(matches[activeIndex]);
              } else if (event.key === "Escape") {
                setClosedFor(input);
                setActive(-1);
              }
            }}
            role="combobox"
            aria-expanded={open}
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-activedescendant={activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined}
            autoComplete="off"
            placeholder={t.placeholder}
            aria-label={t.messageLabel}
            className="min-h-11 min-w-0 flex-1 rounded-control border border-line-field bg-surface px-4 py-2 text-base text-ink placeholder:text-placeholder"
          />
          <button
            type="submit"
            disabled={pending || !input.trim()}
            className="min-h-11 shrink-0 rounded-control bg-action px-5 py-2 text-sm font-semibold text-white hover:bg-action-hover disabled:opacity-50"
          >
            {t.send}
          </button>
        </form>
      </div>
    </div>
  );
}
