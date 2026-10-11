import { createClient, type Client } from "@libsql/client";
import { randomUUID } from "crypto";

export const SEED_USERS = [
  { id: "u_alice", name: "Alice Rahman", email: "alice@ajaia.test" },
  { id: "u_bob", name: "Bob Chen", email: "bob@ajaia.test" },
  { id: "u_carol", name: "Carol Diaz", email: "carol@ajaia.test" },
];

let client: Client | null = null;
let ready: Promise<void> | null = null;

export function getClient(): Client {
  if (!client) {
    client = createClient({
      url: process.env.TURSO_DATABASE_URL || "file:./data/app.db",
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  return client;
}

export async function db(): Promise<Client> {
  const c = getClient();
  if (!ready) {
    ready = init(c).catch((e) => {
      ready = null;
      throw e;
    });
  }
  await ready;
  return c;
}

async function init(c: Client) {
  await c.batch(
    [
      `CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE)`,
      `CREATE TABLE IF NOT EXISTS documents (
         id TEXT PRIMARY KEY, owner_id TEXT NOT NULL REFERENCES users(id),
         title TEXT NOT NULL, content TEXT NOT NULL DEFAULT '<p></p>',
         created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)`,
      `CREATE TABLE IF NOT EXISTS shares (
         doc_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
         user_id TEXT NOT NULL REFERENCES users(id),
         role TEXT NOT NULL CHECK (role IN ('editor','viewer')),
         PRIMARY KEY (doc_id, user_id))`,
      `CREATE INDEX IF NOT EXISTS idx_docs_owner ON documents(owner_id)`,
    ],
    "write"
  );
  for (const u of SEED_USERS) {
    await c.execute({
      sql: "INSERT OR IGNORE INTO users (id,name,email) VALUES (?,?,?)",
      args: [u.id, u.name, u.email],
    });
  }
}

export type DocRow = {
  id: string; owner_id: string; title: string; content: string;
  created_at: number; updated_at: number;
};

export async function listUsers() {
  const c = await db();
  const r = await c.execute("SELECT id,name,email FROM users ORDER BY name");
  return r.rows.map((x) => ({ id: String(x.id), name: String(x.name), email: String(x.email) }));
}

export async function getUser(id: string) {
  const c = await db();
  const r = await c.execute({ sql: "SELECT id,name,email FROM users WHERE id=?", args: [id] });
  const x = r.rows[0];
  return x ? { id: String(x.id), name: String(x.name), email: String(x.email) } : null;
}

export async function getUserByEmail(email: string) {
  const c = await db();
  const r = await c.execute({
    sql: "SELECT id,name,email FROM users WHERE lower(email)=lower(?)",
    args: [email.trim()],
  });
  const x = r.rows[0];
  return x ? { id: String(x.id), name: String(x.name), email: String(x.email) } : null;
}

export async function createDoc(ownerId: string, title: string, content = "<p></p>") {
  const c = await db();
  const id = randomUUID();
  const now = Date.now();
  await c.execute({
    sql: "INSERT INTO documents (id,owner_id,title,content,created_at,updated_at) VALUES (?,?,?,?,?,?)",
    args: [id, ownerId, title, content, now, now],
  });
  return id;
}

export async function getDoc(id: string): Promise<DocRow | null> {
  const c = await db();
  const r = await c.execute({ sql: "SELECT * FROM documents WHERE id=?", args: [id] });
  const x = r.rows[0];
  if (!x) return null;
  return {
    id: String(x.id), owner_id: String(x.owner_id), title: String(x.title),
    content: String(x.content), created_at: Number(x.created_at), updated_at: Number(x.updated_at),
  };
}

export async function getShares(docId: string) {
  const c = await db();
  const r = await c.execute({
    sql: `SELECT s.user_id, s.role, u.name, u.email FROM shares s
          JOIN users u ON u.id = s.user_id WHERE s.doc_id=? ORDER BY u.name`,
    args: [docId],
  });
  return r.rows.map((x) => ({
    userId: String(x.user_id), role: String(x.role) as "editor" | "viewer",
    name: String(x.name), email: String(x.email),
  }));
}

export async function listDocsFor(userId: string) {
  const c = await db();
  const r = await c.execute({
    sql: `SELECT d.id, d.title, d.updated_at, d.owner_id, u.name AS owner_name,
                 CASE WHEN d.owner_id = ?1 THEN 'owner' ELSE s.role END AS role
          FROM documents d
          JOIN users u ON u.id = d.owner_id
          LEFT JOIN shares s ON s.doc_id = d.id AND s.user_id = ?1
          WHERE d.owner_id = ?1 OR s.user_id = ?1
          ORDER BY d.updated_at DESC`,
    args: [userId],
  });
  return r.rows.map((x) => ({
    id: String(x.id), title: String(x.title), updatedAt: Number(x.updated_at),
    ownerName: String(x.owner_name), role: String(x.role) as "owner" | "editor" | "viewer",
  }));
}
