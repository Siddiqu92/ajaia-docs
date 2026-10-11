import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth";
import { listDocsFor } from "@/lib/db";
import DashboardActions from "@/components/DashboardActions";
import LogoutButton from "@/components/LogoutButton";

export const dynamic = "force-dynamic";

const fmt = (t: number) => new Date(t).toISOString().slice(0, 16).replace("T", " ") + " UTC";

export default async function Home() {
  const user = await currentUser();
  if (!user) redirect("/login");
  const docs = await listDocsFor(user.id);
  const mine = docs.filter((d) => d.role === "owner");
  const shared = docs.filter((d) => d.role !== "owner");

  return (
    <>
      <header className="topbar">
        <Link href="/" className="brand">Ajaia Docs</Link>
        <div className="who"><span>{user.name}</span><LogoutButton /></div>
      </header>
      <main className="wrap">
        <h1>Documents</h1>
        <DashboardActions />

        <h2 className="sec">My documents</h2>
        <div className="list">
          {mine.length === 0 && <div className="empty">You haven&apos;t created any documents yet. Start with New document.</div>}
          {mine.map((d) => (
            <Link key={d.id} href={`/docs/${d.id}`} className="row">
              <div><div className="t">{d.title}</div><div className="m">Edited {fmt(d.updatedAt)}</div></div>
              <span className="badge owner">Owner</span>
            </Link>
          ))}
        </div>

        <h2 className="sec">Shared with me</h2>
        <div className="list">
          {shared.length === 0 && <div className="empty">Nothing has been shared with you yet.</div>}
          {shared.map((d) => (
            <Link key={d.id} href={`/docs/${d.id}`} className="row">
              <div><div className="t">{d.title}</div><div className="m">Shared by {d.ownerName} · edited {fmt(d.updatedAt)}</div></div>
              <span className={`badge ${d.role}`}>{d.role === "editor" ? "Can edit" : "View only"}</span>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
