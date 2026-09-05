import type { groupMembers as groupMembersSchema } from "@/lib/db/schema";

type Membership = typeof groupMembersSchema.$inferSelect;

export function isOwnerOrAdmin(membership?: Membership | null) {
  return (
    !!membership &&
    (membership.role === "owner" || membership.role === "admin")
  );
}

export function canManageGroupSettings(membership?: Membership | null) {
  return (
    !!membership && (membership.canManageSettings || isOwnerOrAdmin(membership))
  );
}