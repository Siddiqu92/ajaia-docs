import { notFound, redirect } from "next/navigation";
import { currentUser } from "../../../lib/auth";
import { getDoc, getShares } from "../../../lib/db";
import { resolveRole } from "../../../lib/access";
import Editor from "../../../components/Editor";

export const dynamic = "force-dynamic";

export default async function DocPage({ params }: { params: { id: string } }) {
  const user = await currentUser();
  if (!user) redirect("/login");
  const doc = await getDoc(params.id);
  if (!doc) notFound();
  const role = resolveRole(doc.owner_id, user.id, await getShares(doc.id));
  if (!role) notFound();
  return <Editor id={doc.id} initialTitle={doc.title} initialContent={doc.content} role={role} userName={user.name} />;
}
