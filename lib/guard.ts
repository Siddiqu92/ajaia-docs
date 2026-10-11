import { NextResponse } from "next/server";
import { currentUser } from "./auth";
import { getDoc, getShares, type DocRow } from "./db";
import { resolveRole, type Role } from "./access";

export const err = (message: string, status: number) =>
  NextResponse.json({ error: message }, { status });

/** Loads user + doc + role. Returns a Response on failure. 404 hides docs the user can't see. */
export async function loadDocForUser(
  id: string
): Promise<Response | { user: { id: string; name: string; email: string }; doc: DocRow; role: Role }> {
  const user = await currentUser();
  if (!user) return err("Not signed in.", 401);
  const doc = await getDoc(id);
  if (!doc) return err("Document not found.", 404);
  const role = resolveRole(doc.owner_id, user.id, await getShares(id));
  if (!role) return err("Document not found.", 404);
  return { user, doc, role };
}
