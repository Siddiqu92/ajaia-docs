import { describe, it, expect } from "vitest";
import { fileToHtml, ImportError, titleFromFile } from "@/lib/import";
import { cleanHtml, cleanTitle } from "@/lib/sanitize";

describe("file import", () => {
  it("converts .txt paragraphs and escapes HTML", async () => {
    const html = await fileToHtml("n.txt", Buffer.from("Hello <b>x</b>\n\nSecond"));
    expect(html).toContain("<p>");
    expect(html).not.toContain("<b>x</b>");
    expect(html).toContain("Second");
  });
  it("converts markdown to headings and lists", async () => {
    const html = await fileToHtml("n.md", Buffer.from("# Title\n\n- a\n- b\n\n**bold**"));
    expect(html).toContain("<h1");
    expect(html).toContain("<li>a</li>");
    expect(html).toContain("<strong>bold</strong>");
  });
  it("strips scripts from markdown", async () => {
    const html = await fileToHtml("n.md", Buffer.from("hi <script>alert(1)</script> <img src=x onerror=alert(1)>"));
    expect(html).not.toMatch(/script|onerror|<img/i);
  });
  it("rejects unsupported types, empty and oversized files", async () => {
    await expect(fileToHtml("a.pdf", Buffer.from("x"))).rejects.toBeInstanceOf(ImportError);
    await expect(fileToHtml("a.txt", Buffer.alloc(0))).rejects.toBeInstanceOf(ImportError);
    await expect(fileToHtml("a.txt", Buffer.alloc(3 * 1024 * 1024, "a"))).rejects.toBeInstanceOf(ImportError);
  });
  it("rejects a corrupt .docx", async () => {
    await expect(fileToHtml("a.docx", Buffer.from("not a zip"))).rejects.toBeInstanceOf(ImportError);
  });
  it("derives a title from the filename", () => {
    expect(titleFromFile("meeting_notes-q3.md")).toBe("meeting notes q3");
  });
});

describe("validation", () => {
  it("sanitizes editor html", () => {
    expect(cleanHtml('<p onclick="x()">a</p><script>1</script>')).toBe("<p>a</p>");
    expect(cleanHtml('<a href="javascript:alert(1)">x</a>')).not.toContain("javascript");
  });
  it("validates titles", () => {
    expect(cleanTitle("  ")).toBeNull();
    expect(cleanTitle("a".repeat(121))).toBeNull();
    expect(cleanTitle("  My   doc ")).toBe("My doc");
  });
});
