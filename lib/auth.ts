import { cookies } from "next/headers";
import { getUser } from "./db";

export const COOKIE = "ajaia_uid";

/** Mocked auth: the cookie holds a seeded user id. Replace with real auth in production. */
export async function currentUser() {
  const id = cookies().get(COOKIE)?.value;
  return id ? getUser(id) : null;
}
