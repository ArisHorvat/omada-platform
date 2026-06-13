import { isOrgAdminRole } from '@/src/utils/authRoutes';

/** Whether the user may open the organization admin console for the active org. */
export function canAccessOrgAdminConsole(
  role: string | undefined,
  widgetAccess: Record<string, string> | undefined | null,
): boolean {
  if (isOrgAdminRole(role)) return true;
  const adminLevel = widgetAccess?.admin?.trim().toLowerCase();
  return adminLevel === 'admin';
}

/** Periods, offerings, curriculum packages — org Admin only (not the settings widget). */
export function canAccessOrgStructure(
  role: string | undefined,
  widgetAccess: Record<string, string> | undefined | null,
): boolean {
  return canAccessOrgAdminConsole(role, widgetAccess);
}
