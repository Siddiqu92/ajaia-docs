import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { createDoc, listDocsFor } from "@/lib/db";
import { cleanTitle } from "@/lib/sanitize";
import { err } from "@/lib/guard";

export async function GET() {
  const user = await currentUser();
  if (!user) return err("Not signed in.", 401);
  return NextResponse.json({ docs: await listDocsFor(user.id) });
}

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return err("Not signed in.", 401);
  const body = await req.json().catch(() => ({}));
  const title = body?.title === undefined ? "Untitled document" : cleanTitle(body.title);
  if (!title) return err("Title is required and must be under 120 characters.", 400);
  const id = await createDoc(user.id, title);
  return NextResponse.json({ id }, { status: 201 });
}
