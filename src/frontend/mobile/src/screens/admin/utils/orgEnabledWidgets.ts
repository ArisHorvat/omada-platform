import { WIDGET_KEYS, type WidgetKeyId } from '@/src/config/permissions.config';
import { OrganizationType } from '@/src/api/generatedClient';

/** Always-on member widgets (tab bar / profile) — aligned with backend `IsAlwaysEnabled`. */
export const ALWAYS_ENABLED_WIDGET_KEYS: readonly WidgetKeyId[] = [
  WIDGET_KEYS.schedule,
  WIDGET_KEYS.tasks,
  WIDGET_KEYS.digitalId,
];

/** Shared configurable widgets (both org types). */
const SHARED_CATALOG_KEYS: readonly WidgetKeyId[] = [
  WIDGET_KEYS.chat,
  WIDGET_KEYS.news,
  WIDGET_KEYS.attendance,
  WIDGET_KEYS.users,
  WIDGET_KEYS.rooms,
  WIDGET_KEYS.map,
];

/** University-only catalog widgets. */
const UNIVERSITY_CATALOG_KEYS: readonly WidgetKeyId[] = [
  WIDGET_KEYS.grades,
  WIDGET_KEYS.assignments,
];

/** Corporate-only catalog widgets. */
const CORPORATE_CATALOG_KEYS: readonly WidgetKeyId[] = [WIDGET_KEYS.documents];

export function getCatalogWidgetKeysForOrgType(orgType?: OrganizationType): WidgetKeyId[] {
  const shared = [...SHARED_CATALOG_KEYS];
  if (orgType === OrganizationType.University) {
    return [...shared, ...UNIVERSITY_CATALOG_KEYS];
  }
  if (orgType === OrganizationType.Corporate) {
    return [...shared, ...CORPORATE_CATALOG_KEYS];
  }
  return [...shared, ...UNIVERSITY_CATALOG_KEYS, ...CORPORATE_CATALOG_KEYS];
}

/** Configurable widget keys for an org type — aligned with backend `OrganizationWidgetKeys.GetCatalogKeys`. */
export function getConfigurableWidgetKeys(orgType?: OrganizationType): readonly WidgetKeyId[] {
  return getCatalogWidgetKeysForOrgType(orgType);
}

export function buildEnabledWidgetSet(
  enabledWidgets: string[] | undefined | null,
  orgType?: OrganizationType,
): Set<string> {
  const always = ALWAYS_ENABLED_WIDGET_KEYS.map((k) => k.toLowerCase());
  const catalogKeys = getCatalogWidgetKeysForOrgType(orgType).map((k) => k.toLowerCase());

  if (enabledWidgets == null) {
    return new Set([...catalogKeys, ...always]);
  }

  const configured = enabledWidgets.map((k) => k.trim().toLowerCase()).filter(Boolean);
  const optional = configured.filter((k) => catalogKeys.includes(k));
  if (optional.length === 0 && configured.every((k) => always.includes(k))) {
    return new Set([...always]);
  }

  return new Set([...optional, ...always]);
}

export function isOrgWidgetEnabled(
  widgetKey: string | undefined,
  enabledWidgets: string[] | undefined | null,
  orgType?: OrganizationType,
): boolean {
  if (!widgetKey) return true;
  const normalized = widgetKey.toLowerCase();
  if (ALWAYS_ENABLED_WIDGET_KEYS.some((k) => k.toLowerCase() === normalized)) return true;
  const enabled = buildEnabledWidgetSet(enabledWidgets, orgType);
  return enabled.has(normalized);
}

export function createOrgWidgetEnabledChecker(orgType?: OrganizationType) {
  return (widgetKey: string | undefined, enabledWidgets: string[] | undefined | null) =>
    isOrgWidgetEnabled(widgetKey, enabledWidgets, orgType);
}
