# Submission contents

| Item | Location |
|---|---|
| Source code | `app/`, `components/`, `lib/`, `tests/` |
| Setup / run | `README.md` |
| Architecture note | `docs/ARCHITECTURE.md` |
| AI workflow note | `docs/AI_WORKFLOW.md` |
| Walkthrough video URL | `VIDEO_URL.txt` |
| Live URL | `LIVE_URL.txt` |

## Test accounts
alice@ajaia.test · bob@ajaia.test · carol@ajaia.test (pick from the login dropdown; no password)

## Status
**Working:** create/rename/edit/autosave/reopen, rich text (B/I/U, H1–H3, lists), upload .txt/.md/.docx to a new document, sharing (editor/viewer) with owned vs shared sections, persistence, validation, 12 automated tests.
**Incomplete / cut:** real-time collaboration, real auth, version history, export. Concurrent edits are last-write-wins.
**Next (2–4h):** optimistic concurrency, Markdown export, version history, Playwright E2E.
