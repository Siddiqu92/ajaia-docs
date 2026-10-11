import sanitizeHtml from "sanitize-html";

/** Allow-list matching what the editor can produce. Strips scripts, handlers, styles. */
export function cleanHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "p", "br", "h1", "h2", "h3", "strong", "b", "em", "i", "u", "s",
      "ul", "ol", "li", "blockquote", "code", "pre", "hr", "a",
    ],
    allowedAttributes: { a: ["href"] },
    allowedSchemes: ["http", "https", "mailto"],
  });
}

export const MAX_TITLE = 120;
export function cleanTitle(t: unknown): string | null {
  if (typeof t !== "string") return null;
  const v = t.replace(/\s+/g, " ").trim();
  if (!v || v.length > MAX_TITLE) return null;
  return v;
}
