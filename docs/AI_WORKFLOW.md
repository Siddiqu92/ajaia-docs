# AI workflow note

**Tool used:** Claude (chat with code execution) to scaffold, build and test the app.

## Where AI sped things up
- Scaffolding the Next.js + TipTap + libSQL project, API routes and the share dialog in one pass
- Drafting unit tests and a curl-based end-to-end script for the permission matrix
- First drafts of the README and architecture note

## Problems in AI output that were corrected
- `npm` installed **TypeScript 7**, which Next 14 cannot use (the build failed with an unhelpful error). Fixed by pinning `typescript@5`.
- The `@/` path alias did not resolve in the Next build; added an explicit webpack alias.
- `useRef<ReturnType<typeof setTimeout>>()` failed strict type-checking; fixed the typing.
- Design decision kept: return 404 instead of 403 for documents a user cannot see.

## Verification
- `npm test`: 12 passing unit tests (access rules, import conversion, sanitization, validation)
- Scripted API run covering owner/editor/viewer/stranger permissions, 401 when signed out, bad title (400), unsupported upload (400), persistence after edit, and the shared list for a viewer
- Production build (`next build`) with type-check passes
- **TODO before submitting (author to fill in):** manual browser pass (formatting, autosave, share dialog, viewer read-only state, .docx upload) and anything you changed or rejected yourself.
