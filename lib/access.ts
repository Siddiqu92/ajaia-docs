export type Role = "owner" | "editor" | "viewer";
export type ShareRole = "editor" | "viewer";

/** Pure access logic so it can be unit tested without a database. */
export function resolveRole(
  ownerId: string,
  userId: string,
  shares: { userId: string; role: ShareRole }[]
): Role | null {
  if (ownerId === userId) return "owner";
  const s = shares.find((x) => x.userId === userId);
  return s ? s.role : null;
}

export const canView = (r: Role | null) => r !== null;
export const canEdit = (r: Role | null) => r === "owner" || r === "editor";
export const canShare = (r: Role | null) => r === "owner";
export const canDelete = (r: Role | null) => r === "owner";
