"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useEditor, EditorContent, type Editor as TipTapEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import ShareDialog from "./ShareDialog";

type Role = "owner" | "editor" | "viewer";
type Status = "saved" | "saving" | "unsaved" | "error";

function Toolbar({ editor }: { editor: TipTapEditor }) {
  const B = ({ label, title, active, run }: { label: string; title: string; active: boolean; run: () => void }) => (
    <button type="button" className="tb" title={title} aria-label={title} aria-pressed={active} onClick={run}>{label}</button>
  );
  const c = () => editor.chain().focus();
  return (
    <div className="toolbar" role="toolbar" aria-label="Formatting">
      <B label="B" title="Bold" active={editor.isActive("bold")} run={() => c().toggleBold().run()} />
      <B label="I" title="Italic" active={editor.isActive("italic")} run={() => c().toggleItalic().run()} />
      <B label="U" title="Underline" active={editor.isActive("underline")} run={() => c().toggleUnderline().run()} />
      <span className="sep" />
      <B label="Text" title="Normal text" active={editor.isActive("paragraph")} run={() => c().setParagraph().run()} />
      <B label="H1" title="Heading 1" active={editor.isActive("heading", { level: 1 })} run={() => c().toggleHeading({ level: 1 }).run()} />
      <B label="H2" title="Heading 2" active={editor.isActive("heading", { level: 2 })} run={() => c().toggleHeading({ level: 2 }).run()} />
      <B label="H3" title="Heading 3" active={editor.isActive("heading", { level: 3 })} run={() => c().toggleHeading({ level: 3 }).run()} />
      <span className="sep" />
      <B label="• List" title="Bulleted list" active={editor.isActive("bulletList")} run={() => c().toggleBulletList().run()} />
      <B label="1. List" title="Numbered list" active={editor.isActive("orderedList")} run={() => c().toggleOrderedList().run()} />
    </div>
  );
}

export default function Editor({
  id, initialTitle, initialContent, role, userName,
}: { id: string; initialTitle: string; initialContent: string; role: Role; userName: string }) {
  const readOnly = role === "viewer";
  const [title, setTitle] = useState(initialTitle);
  const savedTitle = useRef(initialTitle);
  const [status, setStatus] = useState<Status>("saved");
  const [errMsg, setErrMsg] = useState("");
  const [shareOpen, setShareOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const dirty = useRef(false);

  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: { levels: [1, 2, 3] } }), Underline, Placeholder.configure({ placeholder: "Start writing…" })],
    content: initialContent,
    editable: !readOnly,
    immediatelyRender: false,
    onUpdate: () => { dirty.current = true; setStatus("unsaved"); schedule(); },
  });

  const save = useCallback(async () => {
    if (!editor || !dirty.current) return;
    dirty.current = false; setStatus("saving");
    try {
      const res = await fetch(`/api/docs/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: editor.getHTML() }) });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Save failed.");
      if (!dirty.current) setStatus("saved");
      setErrMsg("");
    } catch (e) {
      dirty.current = true; setStatus("error"); setErrMsg(e instanceof Error ? e.message : "Save failed.");
    }
  }, [editor, id]);

  function schedule() { clearTimeout(timer.current); timer.current = setTimeout(() => saveRef.current(), 800); }
  const saveRef = useRef(save);
  useEffect(() => { saveRef.current = save; }, [save]);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (dirty.current) { e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("beforeunload", warn);
    return () => { window.removeEventListener("beforeunload", warn); clearTimeout(timer.current); };
  }, []);

  async function commitTitle() {
    const t = title.trim();
    if (t === savedTitle.current) return;
    if (!t) { setTitle(savedTitle.current); setErrMsg("Title can't be empty."); setStatus("error"); return; }
    setStatus("saving");
    const res = await fetch(`/api/docs/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: t }) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { setTitle(savedTitle.current); setStatus("error"); setErrMsg(data.error || "Rename failed."); return; }
    savedTitle.current = data.title; setTitle(data.title); setStatus("saved"); setErrMsg("");
  }

  const label = { saved: "Saved", saving: "Saving…", unsaved: "Unsaved changes", error: errMsg || "Not saved" }[status];

  return (
    <>
      <header className="docbar">
        <Link href="/" className="btn" aria-label="Back to documents">← Documents</Link>
        <input
          className="title-in" value={title} disabled={readOnly} maxLength={120} aria-label="Document title"
          onChange={(e) => setTitle(e.target.value)} onBlur={commitTitle}
          onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
        />
        <span className={`status ${status === "error" ? "bad" : ""}`} role="status" aria-live="polite">{label}</span>
        {status === "error" && !readOnly && <button className="btn" onClick={() => { dirty.current = true; save(); }}>Retry</button>}
        {role === "owner" && <button className="btn primary" onClick={() => setShareOpen(true)}>Share</button>}
        <span className={`badge ${role}`}>{role === "owner" ? "Owner" : role === "editor" ? "Can edit" : "View only"}</span>
      </header>
      {readOnly && <div className="banner">You have view-only access. Ask the owner for edit access to make changes.</div>}
      {editor && !readOnly && <Toolbar editor={editor} />}
      <div className="page"><EditorContent editor={editor} aria-label={`Document body, signed in as ${userName}`} /></div>
      {shareOpen && <ShareDialog docId={id} onClose={() => setShareOpen(false)} />}
    </>
  );
}
