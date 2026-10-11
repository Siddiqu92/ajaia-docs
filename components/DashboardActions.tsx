"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function DashboardActions() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function create() {
    setBusy(true); setError("");
    const res = await fetch("/api/docs", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { setError(data.error || "Could not create document."); setBusy(false); return; }
    router.push(`/docs/${data.id}`);
  }

  async function upload(file: File) {
    setBusy(true); setError("");
    const form = new FormData(); form.append("file", file);
    const res = await fetch("/api/import", { method: "POST", body: form });
    const data = await res.json().catch(() => ({}));
    if (fileRef.current) fileRef.current.value = "";
    if (!res.ok) { setError(data.error || "Upload failed."); setBusy(false); return; }
    router.push(`/docs/${data.id}`);
  }

  return (
    <div>
      <div className="actions">
        <button className="btn primary" onClick={create} disabled={busy}>New document</button>
        <button className="btn" onClick={() => fileRef.current?.click()} disabled={busy}>Upload file</button>
        <input ref={fileRef} type="file" accept=".txt,.md,.docx" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
        <span className="hint">Upload .txt, .md or .docx (max 2 MB) to create an editable document.</span>
      </div>
      {error && <p className="err" role="alert">{error}</p>}
    </div>
  );
}
