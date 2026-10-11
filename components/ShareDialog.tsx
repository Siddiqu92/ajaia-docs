"use client";
import { useEffect, useState } from "react";

type Share = { userId: string; name: string; email: string; role: "editor" | "viewer" };

export default function ShareDialog({ docId, onClose }: { docId: string; onClose: () => void }) {
  const [shares, setShares] = useState<Share[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"editor" | "viewer">("editor");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch(`/api/docs/${docId}/share`).then((r) => r.json()).then((d) => setShares(d.shares ?? []));
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [docId, onClose]);

  async function call(method: "POST" | "DELETE", body: object) {
    setBusy(true); setError("");
    const res = await fetch(`/api/docs/${docId}/share`, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setError(data.error || "Something went wrong."); return false; }
    setShares(data.shares); return true;
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (await call("POST", { email, role })) setEmail("");
  }

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="sh-t" onClick={(e) => e.stopPropagation()}>
        <h2 id="sh-t">Share document</h2>
        <form className="f" onSubmit={add}>
          <input type="email" required placeholder="Email, e.g. bob@ajaia.test" aria-label="Email" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
          <select aria-label="Access level" value={role} onChange={(e) => setRole(e.target.value as "editor" | "viewer")}>
            <option value="editor">Can edit</option><option value="viewer">View only</option>
          </select>
          <button className="btn primary" disabled={busy}>Share</button>
        </form>
        {error && <p className="err" role="alert">{error}</p>}
        <div style={{ marginTop: 12 }}>
          {shares.length === 0 && <p className="hint">Not shared with anyone yet.</p>}
          {shares.map((s) => (
            <div className="share-row" key={s.userId}>
              <div><div>{s.name}</div><div className="hint">{s.email}</div></div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <select aria-label={`Access for ${s.name}`} value={s.role} onChange={(e) => call("POST", { email: s.email, role: e.target.value })}>
                  <option value="editor">Can edit</option><option value="viewer">View only</option>
                </select>
                <button className="btn" onClick={() => call("DELETE", { userId: s.userId })}>Remove</button>
              </div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: "right", marginTop: 16 }}><button className="btn" onClick={onClose}>Done</button></div>
      </div>
    </div>
  );
}
