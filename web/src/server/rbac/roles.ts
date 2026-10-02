import type { UserRole } from "@/db/schema";

export function isSuperAdmin(role: UserRole): boolean {
  return role === "ADMINISTRADOR";
}

export function canManageIntegrations(role: UserRole): boolean {
  return role === "ADMINISTRADOR";
}

export function canUseViewAs(actorRole: UserRole): boolean {
  return actorRole === "ADMINISTRADOR";
}

export { roleLabel } from "@/lib/role-labels";

export { canSeeNavSection, canSeeNavItem } from "@/server/rbac/nav";
