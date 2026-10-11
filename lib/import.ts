import { marked } from "marked";
import { cleanHtml } from "./sanitize";

export const SUPPORTED = [".txt", ".md", ".docx"] as const;
export const MAX_BYTES = 2 * 1024 * 1024; // 2 MB

export class ImportError extends Error {}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function textToHtml(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${esc(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

export function extOf(name: string): string {
  const i = name.lastIndexOf(".");
  return i < 0 ? "" : name.slice(i).toLowerCase();
}

/** Convert an uploaded file into sanitized editor HTML. */
export async function fileToHtml(name: string, data: Buffer): Promise<string> {
  const ext = extOf(name);
  if (!(SUPPORTED as readonly string[]).includes(ext))
    throw new ImportError(`Unsupported file type "${ext || "unknown"}". Use ${SUPPORTED.join(", ")}.`);
  if (data.length === 0) throw new ImportError("The file is empty.");
  if (data.length > MAX_BYTES) throw new ImportError("File is larger than 2 MB.");

  let html: string;
  if (ext === ".txt") html = textToHtml(data.toString("utf8"));
  else if (ext === ".md") html = await marked.parse(data.toString("utf8"));
  else {
    const mammoth = (await import("mammoth")).default;
    try {
      html = (await mammoth.convertToHtml({ buffer: data })).value;
    } catch {
      throw new ImportError("Could not read this .docx file. Is it a valid Word document?");
    }
  }
  return cleanHtml(html) || "<p></p>";
}

export function titleFromFile(name: string): string {
  const base = name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim();
  return (base || "Imported document").slice(0, 120);
}
