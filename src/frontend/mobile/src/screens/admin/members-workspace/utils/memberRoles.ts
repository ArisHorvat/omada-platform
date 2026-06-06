const NON_INVITABLE_ROLE_NAMES = new Set(['admin', 'superadmin', 'super admin']);

export function isInvitableRoleName(name: string | undefined | null): boolean {
  if (!name) return false;
  return !NON_INVITABLE_ROLE_NAMES.has(name.trim().toLowerCase());
}

export function filterAssignableRoles<T extends { name?: string | null }>(roles: T[]): T[] {
  return roles.filter((r) => isInvitableRoleName(r.name));
}
