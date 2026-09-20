# Agua Vecina

Clear, local, verified water information for neighbors during service interruptions.

> **Status:** this is the initial application scaffold. It renders a placeholder page only; no product functionality has been built yet.

## Requirements

- Node.js 20.9 or newer
- npm

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

Then open http://localhost:3000.

## Build

```bash
npm run build
```

## Other scripts

- `npm run lint` runs ESLint.
- `npm run typecheck` runs `tsc --noEmit`.
- `npm run start` serves the production build.

## Stack

Next.js (App Router), React, TypeScript, Tailwind CSS, and ESLint, with source under `src/` and the `@/*` import alias.

`designs/agua-vecina/` holds the imported design reference. It is not application code and is excluded from linting.
