/** Route groups that keep the primary nav rail visible on wide layouts (web / tablet). */
const SIDEBAR_ROUTE_GROUPS = new Set(['(tabs)', '(widgets)', '(settings)', '(admin)']);

/**
 * Whether the dashboard/tasks/schedule sidebar should stay mounted for the current route.
 * Super-admin platform screen and modals use full-width layouts.
 */
export function shouldShowAppSidebar(segments: readonly string[]): boolean {
  const appSection = segments[0] === '(app)' ? segments[1] : segments[0];
  if (!appSection) return false;
  return SIDEBAR_ROUTE_GROUPS.has(appSection);
}

export function shouldShowAdminSidebar(segments: readonly string[]): boolean {
  const appSection = segments[0] === '(app)' ? segments[1] : segments[0];
  return appSection === '(admin)';
}
