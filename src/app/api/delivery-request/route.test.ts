// @vitest-environment node
import { beforeEach, expect, test, vi } from "vitest";

import { AAA_LINE } from "@/lib/contacts";
import { ommeContact } from "@/lib/plan";
import { formatDeliveryMessage } from "@/server/telegram";
import { POST } from "./route";

const valid = { name: "QA", phone: "787-555-1234", community: "Villa Prueba", consent: true };
let ip = 0;
const post = (body: unknown) =>
  POST(
    new Request("http://test/api/delivery-request", {
      method: "POST",
      headers: { "x-forwarded-for": `10.0.0.${++ip}` },
      body: JSON.stringify(body),
    }),
  );

beforeEach(() => {
  // Never reaches Telegram: no credentials, and any fetch fails the test.
  vi.stubEnv("TELEGRAM_BOT_TOKEN", "");
  vi.stubEnv("TELEGRAM_CHAT_ID", "");
  vi.stubGlobal("fetch", () => Promise.reject(new Error("no network in tests")));
});

test("location inside Puerto Rico is accepted", async () => {
  const res = await post({ ...valid, approxLocation: { lat: 18.44431, lng: -66.02034 } });
  expect(res.status).toBe(200);
  expect(await res.json()).toMatchObject({ ok: true, delivered: false, locationAccepted: true });
});

test("location outside Puerto Rico is dropped, the request still goes through", async () => {
  const res = await post({ ...valid, approxLocation: { lat: 40.7128, lng: -74.006 } });
  expect(res.status).toBe(200);
  expect(await res.json()).toMatchObject({ ok: true, locationAccepted: false });
});

test("missing consent is rejected", async () => {
  const res = await post({ ...valid, consent: false });
  expect(res.status).toBe(400);
});

test("operator brief: prototype header, call + OMME/AAA steps, no named site, location link only when shared", () => {
  const base = {
    name: "María",
    phone: "7875551234",
    community: "Urb. Villa Carolina",
    municipality: "Carolina",
    zone: "zone1" as const,
    needs: ["baby" as const, "no_transport" as const],
    note: null,
    locale: "es" as const,
    noTransport: true,
    simulated: false,
    statusSummary: "rationing ended (reported Sep 17, 2026); no scheduled rotation",
  };
  const omme = ommeContact("Carolina")!;
  const shared = formatDeliveryMessage(
    { ...base, approxLocation: { lat: 18.444, lng: -66.02 } },
    new Date("2026-09-21T15:30:00Z"),
  );
  console.info(`\n${shared}\n`); // the rendered brief, for the hand-off report; nothing is sent
  expect(shared.split("\n")[0]).toBe("WATER HELP REQUEST (prototype)");
  expect(shared).toContain("María asked for help getting water in Urb. Villa Carolina, Carolina.");
  expect(shared).toContain("Household: baby at home · no transportation\nSpeaks: Spanish");
  expect(shared).toContain("1. Call María: (787) 555-1234 · tap to call: +17875551234");
  expect(shared).toContain("2. Ask what they need and where a safe hand-off spot is (we never collect street addresses).");
  expect(shared).toContain(`3. Point them to ${omme.agency}: ${omme.phones[0]} and AAA ${AAA_LINE.display}.`);
  expect(shared).toContain("4. Approximate location (±100 m): https://www.google.com/maps/search/?api=1&query=18.444%2C-66.02");
  expect(shared).toContain("Zone 1 · rationing ended (reported Sep 17, 2026); no scheduled rotation");
  expect(shared).toContain("Sent Sep 21, 2026, 11:30 AM (Puerto Rico time)");
  // Un-spoofed: nobody is sent to an unpublished site, there is no fleet, and no emoji.
  expect(shared).not.toMatch(/Pick up|Pozo|maps\/dir|volunteer|\p{Extended_Pictographic}/u);

  const bare = formatDeliveryMessage({
    ...base,
    municipality: null,
    zone: null,
    needs: [],
    noTransport: false,
    statusSummary: null,
    simulated: true,
    approxLocation: null,
  });
  expect(bare).toContain("3. Point them to their municipal emergency office (OMME) and AAA (787) 620-2482.");
  expect(bare).not.toContain("4.");
  expect(bare).not.toContain("Household:");
  expect(bare).not.toContain("Zone");
  expect(bare).toContain("· sent while the app was in replay mode (not today's status)");
  expect(bare).not.toMatch(/\n{3}/); // absent optional lines leave no holes
});

test("status line: control characters are stripped, over-long is rejected, a stale client's pickupPoint is ignored", async () => {
  const res = await post({
    ...valid,
    pickupPoint: { name: "Evil Depot", municipality: "Nowhere" },
    statusSummary: "no service\nuntil\u202E tomorrow",
  });
  expect(res.status).toBe(200);
  expect((await post({ ...valid, statusSummary: "x".repeat(121) })).status).toBe(400);
});
