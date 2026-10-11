import { NextResponse } from "next/server";
import { db, getShares, getUserByEmail } from "../../../../../lib/db";
import { canShare } from "../../../../../lib/access";
import { err, loadDocForUser } from "../../../../../lib/guard";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const r = await loadDocForUser(params.id);
  if (r instanceof Response) return r;
  if (!canShare(r.role)) return err("Only the owner can manage sharing.", 403);
  return NextResponse.json({ shares: await getShares(params.id) });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const r = await loadDocForUser(params.id);
  if (r instanceof Response) return r;
  if (!canShare(r.role)) return err("Only the owner can manage sharing.", 403);

  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const role = body?.role === "viewer" ? "viewer" : body?.role === "editor" ? "editor" : null;
  if (!email || !role) return err("Provide an email and a role (editor or viewer).", 400);

  const target = await getUserByEmail(email);
  if (!target) return err("No user with that email. Try alice@, bob@ or carol@ajaia.test.", 404);
  if (target.id === r.doc.owner_id) return err("That person already owns this document.", 400);

  await (await db()).execute({
    sql: `INSERT INTO shares (doc_id,user_id,role) VALUES (?,?,?)
          ON CONFLICT(doc_id,user_id) DO UPDATE SET role=excluded.role`,
    args: [params.id, target.id, role],
  });
  return NextResponse.json({ shares: await getShares(params.id) });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const r = await loadDocForUser(params.id);
  if (r instanceof Response) return r;
  if (!canShare(r.role)) return err("Only the owner can manage sharing.", 403);
  const body = await req.json().catch(() => null);
  if (typeof body?.userId !== "string") return err("userId is required.", 400);
  await (await db()).execute({
    sql: "DELETE FROM shares WHERE doc_id=? AND user_id=?",
    args: [params.id, body.userId],
  });
  return NextResponse.json({ shares: await getShares(params.id) });
}
