export function isOrgAdminRole(role: string | undefined): boolean {
  const r = role?.trim() ?? '';
  return r === 'Admin' || r === 'SuperAdmin' || r === 'Super Admin';
}

export function homeHrefForRole(role: string | undefined): '/org-dashboard' | '/dashboard' {
  return isOrgAdminRole(role) ? '/org-dashboard' : '/dashboard';
}
