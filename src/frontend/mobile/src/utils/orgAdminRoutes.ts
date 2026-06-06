import { isOrgAdminRole } from '@/src/utils/authRoutes';
import { ADMIN_ACCOUNT_HOME } from '@/src/screens/admin/utils/adminAccountRoutes';

const ADMIN_WORKSPACE_SEGMENT = '-workspace';

/** Paths org admins may use without being redirected back to the console. */
export function isAllowedOrgAdminPath(pathname: string, role: string | undefined): boolean {
  const path = pathname.toLowerCase();

  if (path.includes('change-organization')) return true;
  if (path.includes('join-organization')) return true;
  if (path.includes(ADMIN_WORKSPACE_SEGMENT)) return true;
  if (path.includes('org-dashboard')) return true;
  if (path.includes('edit-admin-profile')) return true;
  if (path.includes('admin-profile')) return true;
  if (path.includes('admin-settings')) return true;
  if (path.includes('admin-security')) return true;
  if (path.includes('admin-digital-id')) return true;

  if (role === 'SuperAdmin' && path.includes('admin-dashboard')) return true;

  return false;
}
export function shouldLockOrgAdminToConsole(role: string | undefined): boolean {
  return isOrgAdminRole(role);
}

export function isAdminShellSegment(segments: readonly string[]): boolean {
  const appSection = segments[0] === '(app)' ? segments[1] : segments[0];
  return appSection === '(admin)';
}
