"use client";

import { useEffect, useRef, useState } from "react";
import { assist } from "@/lib/assistant";
import { PLAN } from "@/lib/interruptions";

type Message = { role: "user" | "bot"; text: string };

const GREETING: Message = {
  role: "bot",
  text: 'Tell me where you are and what you need — e.g. "I\'m in Isla Verde with a baby and no car."',
};

export function WaterChat({ onFocus }: { onFocus: (siteId: string) => void }) {
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function send() {
    const text = input.trim();
    if (!text) return;

    const { reply, focusSiteId } = assist(text);
    setMessages((prev) => [...prev, { role: "user", text }, { role: "bot", text: reply }]);
    if (focusSiteId) onFocus(focusSiteId);
    setInput("");
  }

  return (
    <div className="flex h-full flex-col bg-white">
      <header className="border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">Agua Vecina</h1>
          <span className="rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-500">
            Demo
          </span>
        </div>
        <p className="mt-0.5 text-xs text-gray-500">
          Find the most practical water point.{" "}
          <a
            href={PLAN.pdfPath}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sky-600 underline"
          >
            AAA notice
          </a>
        </p>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={message.role === "user" ? "flex justify-end" : "flex justify-start"}
          >
            <div
              className={
                message.role === "user"
                  ? "max-w-[85%] rounded-2xl rounded-br-sm bg-sky-600 px-3 py-2 text-sm text-white"
                  : "max-w-[85%] whitespace-pre-line rounded-2xl rounded-bl-sm bg-gray-100 px-3 py-2 text-sm text-gray-800"
              }
            >
              {message.text}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <form
        className="flex gap-2 border-t p-3"
        onSubmit={(event) => {
          event.preventDefault();
          send();
        }}
      >
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Describe where you are and what you need…"
          className="flex-1 rounded-full border px-4 py-2 text-sm outline-none focus:border-sky-500"
          aria-label="Message"
        />
        <button
          type="submit"
          className="rounded-full bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
          disabled={!input.trim()}
        >
          Send
        </button>
      </form>
    </div>
  );
}
