import { NextResponse } from "next/server";
import { db } from "../../../../lib/db";
import { canDelete, canEdit } from "../../../../lib/access";
import { cleanHtml, cleanTitle } from "../../../../lib/sanitize";
import { err, loadDocForUser } from "../../../../lib/guard";

const MAX_CONTENT = 1_000_000;

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const r = await loadDocForUser(params.id);
  if (r instanceof Response) return r;
  return NextResponse.json({ id: r.doc.id, title: r.doc.title, content: r.doc.content, role: r.role, updatedAt: r.doc.updated_at });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const r = await loadDocForUser(params.id);
  if (r instanceof Response) return r;
  if (!canEdit(r.role)) return err("You have view-only access to this document.", 403);

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return err("Invalid request body.", 400);

  let title = r.doc.title;
  let content = r.doc.content;
  if ("title" in body) {
    const t = cleanTitle(body.title);
    if (!t) return err("Title is required and must be under 120 characters.", 400);
    title = t;
  }
  if ("content" in body) {
    if (typeof body.content !== "string") return err("Content must be a string.", 400);
    if (body.content.length > MAX_CONTENT) return err("Document is too large to save.", 413);
    content = cleanHtml(body.content);
  }
  const updatedAt = Date.now();
  await (await db()).execute({
    sql: "UPDATE documents SET title=?, content=?, updated_at=? WHERE id=?",
    args: [title, content, updatedAt, params.id],
  });
  return NextResponse.json({ ok: true, title, updatedAt });
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const r = await loadDocForUser(params.id);
  if (r instanceof Response) return r;
  if (!canDelete(r.role)) return err("Only the owner can delete this document.", 403);
  const c = await db();
  await c.batch(
    [
      { sql: "DELETE FROM shares WHERE doc_id=?", args: [params.id] },
      { sql: "DELETE FROM documents WHERE id=?", args: [params.id] },
    ],
    "write"
  );
  return NextResponse.json({ ok: true });
}
