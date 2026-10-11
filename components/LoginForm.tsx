"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm({ users }: { users: { id: string; name: string; email: string }[] }) {
  const router = useRouter();
  const [userId, setUserId] = useState(users[0]?.id ?? "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError("");
    const res = await fetch("/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId }) });
    if (!res.ok) { setError((await res.json().catch(() => ({}))).error || "Sign in failed."); setBusy(false); return; }
    router.push("/"); router.refresh();
  }

  return (
    <form className="login" onSubmit={submit}>
      <h1>Ajaia Docs</h1>
      <p className="hint">Demo sign-in. Pick a seeded account; no password needed.</p>
      <label htmlFor="user">Account</label>
      <select id="user" value={userId} onChange={(e) => setUserId(e.target.value)}>
        {users.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
      </select>
      {error && <p className="err" role="alert">{error}</p>}
      <button className="btn primary" disabled={busy}>Sign in</button>
    </form>
  );
}
