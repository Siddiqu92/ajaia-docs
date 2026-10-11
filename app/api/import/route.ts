import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth";
import { createDoc } from "@/lib/db";
import { fileToHtml, ImportError, titleFromFile } from "@/lib/import";
import { err } from "@/lib/guard";

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return err("Not signed in.", 401);
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return err("Choose a file to upload.", 400);
  try {
    const html = await fileToHtml(file.name, Buffer.from(await file.arrayBuffer()));
    const id = await createDoc(user.id, titleFromFile(file.name), html);
    return NextResponse.json({ id }, { status: 201 });
  } catch (e) {
    if (e instanceof ImportError) return err(e.message, 400);
    console.error(e);
    return err("Import failed. Try a different file.", 500);
  }
}
