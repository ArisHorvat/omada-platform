/** Primary account hub for organization admins (profile-like, stays in admin shell). */
export const ADMIN_ACCOUNT_HOME = '/admin-profile';

export function adminAccountRoute(path: 'settings' | 'security' | 'digital-id' | 'edit-profile'): string {
  switch (path) {
    case 'settings':
      return '/admin-settings';
    case 'security':
      return '/admin-security';
    case 'digital-id':
      return '/admin-digital-id';
    case 'edit-profile':
      return '/edit-admin-profile';
  }
}
