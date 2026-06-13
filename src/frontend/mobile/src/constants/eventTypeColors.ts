/** Curated palette for schedule events, room booking, and org event-type admin. */
export const EVENT_TYPE_COLOR_PRESETS = [
  '#3b82f6',
  '#6366f1',
  '#8b5cf6',
  '#a855f7',
  '#ec4899',
  '#ef4444',
  '#dc2626',
  '#f97316',
  '#f59e0b',
  '#eab308',
  '#84cc16',
  '#10b981',
  '#14b8a6',
  '#06b6d4',
  '#0ea5e9',
  '#64748b',
  '#78716c',
  '#475569',
] as const;

export const DEFAULT_EVENT_TYPE_COLOR = EVENT_TYPE_COLOR_PRESETS[0];

const HEX_RE = /^#(?:[0-9a-fA-F]{3}){1,2}$/;

export function isValidEventTypeColor(hex: string | null | undefined): boolean {
  return !!hex && HEX_RE.test(hex.trim());
}

/** Keeps custom colors; falls back to default when invalid. */
export function normalizeEventTypeColor(hex: string | null | undefined): string {
  const trimmed = hex?.trim() ?? '';
  return isValidEventTypeColor(trimmed) ? trimmed : DEFAULT_EVENT_TYPE_COLOR;
}

/** Presets plus the current value when it is not already in the list. */
export function eventTypeColorOptions(current?: string | null): string[] {
  const normalized = normalizeEventTypeColor(current);
  if (EVENT_TYPE_COLOR_PRESETS.includes(normalized as (typeof EVENT_TYPE_COLOR_PRESETS)[number])) {
    return [...EVENT_TYPE_COLOR_PRESETS];
  }
  return [normalized, ...EVENT_TYPE_COLOR_PRESETS];
}
