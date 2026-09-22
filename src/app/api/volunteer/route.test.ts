// @vitest-environment node
import { beforeEach, expect, test, vi } from "vitest";

import { formatVolunteerMessage } from "@/server/telegram";
import { POST } from "./route";

const valid = {
  name: "QA",
  phone: "787-555-1234",
  telegram: "@qa_volunteer",
  municipalities: ["Carolina", "San Juan"],
  help: ["deliver"],
  hasVehicle: true,
  languages: ["es", "en"],
  consent: true,
};
let ip = 0;
const post = (body: unknown) =>
  POST(
    new Request("http://test/api/volunteer", {
      method: "POST",
      headers: { "x-forwarded-for": `10.1.0.${++ip}` },
      body: JSON.stringify(body),
    }),
  );

beforeEach(() => {
  // Never reaches Telegram: no credentials, and any fetch fails the test.
  vi.stubEnv("TELEGRAM_BOT_TOKEN", "");
  vi.stubEnv("TELEGRAM_CHAT_ID", "");
  vi.stubEnv("TELEGRAM_OPERATOR_CHAT_ID", "");
  vi.stubGlobal("fetch", () => Promise.reject(new Error("no network in tests")));
});

test("a valid sign-up goes through (demo mode without credentials)", async () => {
  const res = await post(valid);
  expect(res.status).toBe(200);
  expect(await res.json()).toMatchObject({ ok: true, delivered: false, reason: "not_configured" });
});

test.each([
  ["no consent", { consent: false }, "consent"],
  ["a municipality outside the notice", { municipalities: ["Mayagüez"] }, "municipalities"],
  ["a bad Telegram handle", { telegram: "no spaces allowed" }, "telegram"],
  ["nothing they can help with", { help: [] }, "help"],
])("rejects %s", async (_label, patch, field) => {
  const res = await post({ ...valid, ...patch });
  expect(res.status).toBe(400);
  expect((await res.json()).fields).toContain(field);
});

test("operator brief: who, how to reach them, and the vetting step", () => {
  const message = formatVolunteerMessage({
    name: "Ana",
    phone: "7875551234",
    telegram: "ana_pr",
    municipalities: ["Carolina"],
    help: ["deliver", "calls"],
    availability: ["weekends"],
    hasVehicle: true,
    languages: ["es"],
    note: null,
  });
  expect(message).toContain("NEW VOLUNTEER SIGN-UP");
  expect(message).toContain("(787) 555-1234");
  expect(message).toContain("https://t.me/ana_pr");
  expect(message).toContain("only add people you have spoken with");
});
