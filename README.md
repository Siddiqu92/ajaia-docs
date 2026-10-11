# Ajaia Docs

A lightweight collaborative document editor (Google Docs-inspired) built for the Ajaia Full Stack Product Engineer assessment.

**Stack:** Next.js 14 (App Router, TypeScript) · TipTap editor · libSQL/SQLite (Turso in production) · Vitest

## Features
- Create, rename, edit, autosave and reopen documents
- Rich text: bold, italic, underline, H1–H3, bulleted and numbered lists
- File upload: `.txt`, `.md`, `.docx` (max 2 MB) become new editable documents
- Sharing: owner can grant **Can edit** or **View only** access by email, change it, or remove it
- Dashboard separates **My documents** (Owner badge) from **Shared with me** (Can edit / View only badge)
- Persistence in SQL; sanitized HTML is stored, so formatting survives refresh

## Run locally
Requires Node 18+.
```bash
npm install
npm run dev        # http://localhost:3000
```
No configuration needed. A SQLite file is created at `data/app.db` and three users are seeded.

```bash
npm test                     # unit tests
npm run build && npm start   # production mode
```

## Test accounts (mocked login: pick from a dropdown)
| Name | Email |
|---|---|
| Alice Rahman | alice@ajaia.test |
| Bob Chen | bob@ajaia.test |
| Carol Diaz | carol@ajaia.test |

## Demo the sharing flow
1. Sign in as **Alice**, click **New document**, type something, click **Share**.
2. Share with `bob@ajaia.test` as *Can edit* and `carol@ajaia.test` as *View only*.
3. Sign out, sign in as **Bob**: the doc is under *Shared with me* and is editable.
4. Sign in as **Carol**: the doc opens read-only with a banner and no toolbar.

## Deploy (Vercel + Turso, both free)
1. Create a Turso database: `turso db create ajaia-docs`, then `turso db show ajaia-docs --url` and `turso db tokens create ajaia-docs`.
2. Import the repo in Vercel and set env vars `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`.
3. Deploy. Tables and seed users are created automatically on first request.

A plain SQLite file does not persist on Vercel's serverless filesystem, which is why Turso is used there. The same client code handles both.

## Limitations
See `docs/ARCHITECTURE.md`.
