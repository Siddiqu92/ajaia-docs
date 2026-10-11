import { describe, it, expect } from "vitest";
import { resolveRole, canEdit, canShare, canView, canDelete } from "@/lib/access";

const shares = [
  { userId: "bob", role: "editor" as const },
  { userId: "carol", role: "viewer" as const },
];

describe("access control", () => {
  it("owner has full rights", () => {
    const r = resolveRole("alice", "alice", shares);
    expect(r).toBe("owner");
    expect(canEdit(r) && canShare(r) && canDelete(r)).toBe(true);
  });
  it("editor can edit but not share or delete", () => {
    const r = resolveRole("alice", "bob", shares);
    expect(r).toBe("editor");
    expect(canEdit(r)).toBe(true);
    expect(canShare(r) || canDelete(r)).toBe(false);
  });
  it("viewer can only view", () => {
    const r = resolveRole("alice", "carol", shares);
    expect(canView(r)).toBe(true);
    expect(canEdit(r)).toBe(false);
  });
  it("strangers have no access", () => {
    const r = resolveRole("alice", "mallory", shares);
    expect(r).toBeNull();
    expect(canView(r)).toBe(false);
  });
});
