import { WIDGET_KEYS, type WidgetKeyId } from '@/src/config/permissions.config';

/** Configurable widget keys (non-core) — aligned with backend `OrganizationWidgetKeys.GetConfigurableKeys`. */
export const CONFIGURABLE_WIDGET_KEYS: readonly WidgetKeyId[] = [
  WIDGET_KEYS.chat,
  WIDGET_KEYS.news,
  WIDGET_KEYS.events,
  WIDGET_KEYS.schedule,
  WIDGET_KEYS.tasks,
  WIDGET_KEYS.documents,
  WIDGET_KEYS.grades,
  WIDGET_KEYS.assignments,
  WIDGET_KEYS.attendance,
  WIDGET_KEYS.users,
  WIDGET_KEYS.groups,
  WIDGET_KEYS.finance,
  WIDGET_KEYS.rooms,
  WIDGET_KEYS.transport,
  WIDGET_KEYS.map,
  WIDGET_KEYS.digitalId,
];

export function buildEnabledWidgetSet(enabledWidgets: string[] | undefined | null): Set<string> {
  if (!enabledWidgets?.length) {
    return new Set(CONFIGURABLE_WIDGET_KEYS.map((k) => k.toLowerCase()));
  }
  return new Set(enabledWidgets.map((k) => k.trim().toLowerCase()).filter(Boolean));
}

export function isOrgWidgetEnabled(
  widgetKey: string | undefined,
  enabledWidgets: string[] | undefined | null,
): boolean {
  if (!widgetKey) return true;
  const enabled = buildEnabledWidgetSet(enabledWidgets);
  return enabled.has(widgetKey.toLowerCase());
}
