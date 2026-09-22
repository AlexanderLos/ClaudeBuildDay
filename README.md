# Water Neighbor

Puerto Rico's water authority (AAA) publishes its scheduled-interruption plans as multi-page PDFs.
Water Neighbor turns one of them — the 18-page plan for the Sergio Cuevas filtration plant
(Carraízo reservoir, August 2026) — into a tool a resident can actually use, in English or Spanish:
type your neighborhood and it tells you your zone, what the published calendar says, the live
reservoir level, and who to call.

Built at Claude Code Build Day, Miami, September 2026.

## What it does

**For residents (`/`)**

- A chat that understands "Vivo en Villa Carolina, tengo un bebé y no tengo carro." It matches
  the community against the 300+ communities in the notice (accent-insensitive, with typo
  suggestions and one-question clarifications), tells you your zone and status, and puts the
  right phone numbers one tap away. Claude phrases the answer; every fact comes from the data.
- A status banner with the plan's current state (scheduled rationing ended September 17, 2026),
  its source, the date it was last verified, and the live Carraízo reservoir level from USGS.
- A map of the seven affected municipalities with their emergency-management (OMME) numbers and
  the AAA customer line.
- The August and September calendars as AAA published them, with a replay mode to see what the
  calendar said for any day the plan was in effect.
- A water-help request that reaches the site operator on Telegram, plus a **Share** button that
  turns the answer into a WhatsApp-ready summary.

**For coordinators (`/admin`)** — the intake side: upload the AAA notice PDF, review the values
Claude extracts, publish only what you approve. The extraction pipeline is in `src/server/`; on
this branch the review UI runs on a sample notice.

**Also:** `/help` lists organizations helping Puerto Rico communities get water, and
`/volunteer` collects volunteer sign-ups for the next interruption.

## Where the data comes from

- `src/data/agua-vecina-source-data.json` — the structured extraction of the official AAA notice
  (zones, communities, calendar, sites named in the plan, OMME phone numbers, source pages). It is
  the single source of truth for the resident experience and is never modified at runtime.
- `src/data/september-calendar.json` — the September calendar AAA published on August 31, 2026.
- `src/lib/plan-status.ts` — the plan's status (paused September 2, reported ended September 17),
  with the reporting each claim comes from and the date it was last verified.
- `src/lib/contacts.ts` — AAA's customer-service line, from acueductos.pr.gov.
- `/api/reservoir` — the Carraízo level from USGS station 50059000, cached ten minutes.

The nine water-support sites the notice names are listed exactly as the notice lists them. AAA did
not publish their locations, so the app does not map them or give directions to them.

## Running it

Requires Node.js 20.9 or newer.

```bash
npm install
cp .env.example .env.local   # then fill in the keys you have
npm run dev                  # http://localhost:3000
```

Environment variables (all optional; the app degrades honestly without them):

| Variable | Purpose |
| --- | --- |
| `ANTHROPIC_API_KEY` | Phrases chat answers and powers `/admin` extraction. Without it, answers use the built-in wording. |
| `ANTHROPIC_CHAT_MODEL` | Chat model; defaults to `claude-haiku-4-5-20251001`. |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | Where water-help requests are sent. Without them the form says so and sends nothing. |
| `TELEGRAM_OPERATOR_CHAT_ID` | Where volunteer sign-ups go (they include the volunteer's phone number). |

Other scripts: `npm run build`, `npm run lint`, `npm run typecheck`, `npm test`.

## Layout

```
src/app/            routes: /, /help, /volunteer, /admin, and the API routes
src/components/     resident UI (map, chat, result card, forms) and the coordinator workspace
src/server/         Claude calls, Telegram notifications, request validation (server only)
src/lib/            plan lookups, calendar, contracts, status, contacts
src/i18n/           English and Spanish copy
src/data/           the notice data and the September calendar
```
