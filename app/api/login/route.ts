import { NextResponse } from "next/server";
import { COOKIE } from "@/lib/auth";
import { getUser } from "@/lib/db";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const user = body?.userId ? await getUser(String(body.userId)) : null;
  if (!user) return NextResponse.json({ error: "Unknown user." }, { status: 400 });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, user.id, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 });
  return res;
}
