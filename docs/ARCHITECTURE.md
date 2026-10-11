# Architecture note

## Shape
One Next.js app: React UI + route handlers (`app/api/*`) + a thin data layer (`lib/db.ts`). Chosen so one person can build, test and deploy the whole thing in the timebox.

| Concern | Choice | Why |
|---|---|---|
| Editor | TipTap (ProseMirror) | Bold/italic/underline/headings/lists out of the box; far less risk than hand-rolling `contentEditable` |
| Storage | libSQL: `file:` locally, Turso remote in prod | Same client and SQL both places; free; relational model fits sharing |
| Content format | Sanitized HTML | Round-trips with TipTap, easy to render, easy to import into |
| Auth | Mocked: seeded users, `httpOnly` cookie with user id | Brief allows it; keeps time on sharing logic. **Not secure for production.** |

## Data model
`users(id, name, email)` · `documents(id, owner_id, title, content, created_at, updated_at)` · `shares(doc_id, user_id, role editor|viewer)` with PK `(doc_id, user_id)` so re-sharing updates the role.

## Access logic
`lib/access.ts` is a pure function (`resolveRole`) plus `canView/canEdit/canShare/canDelete`. Every API route goes through `loadDocForUser`, which enforces auth and returns **404 (not 403)** for documents the user cannot see, so document ids don't leak. The editor UI also hides controls by role, but the server is the source of truth.

## Prioritized
1. Core loop: create → edit → autosave → reopen (debounced save, status indicator, retry on failure, unload warning)
2. Sharing with real server-side enforcement and clear owned/shared distinction
3. Import (.txt/.md/.docx) with size/type validation and friendly errors
4. Safety: HTML sanitization on both import and save, title/size validation
5. Tests on the two riskiest pure pieces: access rules and import/sanitization

## Deliberately cut
- Real-time collaboration and presence. Concurrent edits are **last-write-wins**.
- Real authentication / invites for unknown emails (sharing only targets existing users)
- Version history, comments, export, attachments
- Browser-level/E2E tests and rate limiting

## Next with 2–4 more hours
Optimistic concurrency (`updated_at` check, conflict message), Markdown export, version history table, Playwright test for the share flow, real auth (Auth.js).
