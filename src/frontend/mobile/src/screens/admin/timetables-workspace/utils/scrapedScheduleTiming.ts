import type { ScrapedEventDto } from '@/src/api/generatedClient';

/** Scraped row with optional normalized time fields from schedule import API. */
export type NormalizedScrapedEvent = ScrapedEventDto & {
  dayLabel?: string | null;
  hoursLabel?: string | null;
  frequencyLabel?: string | null;
  dayOfWeek?: number | null;
  startTimeLocal?: string | null;
  hoursPerSession?: number | null;
  frequency?: string | null;
  biweeklyPhase?: number | null;
  timeParsed?: boolean;
  timeParseWarning?: string | null;
};

export type ResolvedScrapedTiming = {
  dayOfWeek: number | null;
  startTimeLocal: string | null;
  hoursPerSession: number;
  frequency: string;
  biweeklyPhase: number | null;
  timeParsed: boolean;
  timeParseWarning?: string | null;
};

const DAY_TOKENS: Record<string, number> = {
  luni: 1,
  monday: 1,
  mon: 1,
  marti: 2,
  marți: 2,
  tuesday: 2,
  tue: 2,
  miercuri: 3,
  wednesday: 3,
  wed: 3,
  joi: 4,
  thursday: 4,
  thu: 4,
  vineri: 5,
  friday: 5,
  fri: 5,
  sambata: 6,
  sâmbătă: 6,
  saturday: 6,
  sat: 6,
  duminica: 0,
  duminică: 0,
  sunday: 0,
  sun: 0,
};

const TIME_RANGE = /(\d{1,2})\s*[:\.]\s*(\d{2})\s*[-–—/]\s*(\d{1,2})\s*[:\.]\s*(\d{2})/;
const HOUR_ONLY_RANGE = /(?<!\d)(\d{1,2})\s*[-–—/]\s*(\d{1,2})(?!\s*[:\.]\d)/;
const SINGLE_TIME = /(?<!\d)(\d{1,2})\s*[:\.]\s*(\d{2})(?!\s*[-–—/])/;
const SAPT_TOKEN = /sapt[\s.\-_/]*\d+/gi;

function stripDiacritics(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '');
}

function normalizeToken(value: string): string {
  return stripDiacritics(value.trim().toLowerCase()).replace(/[.,;:]+$/g, '');
}

function stripSaptTokens(text?: string | null): string {
  if (!text?.trim()) return '';
  return text.replace(SAPT_TOKEN, ' ').replace(/\s+/g, ' ').trim();
}

function dayCandidates(text?: string | null): string[] {
  if (!text?.trim()) return [];
  const raw = text.trim();
  const first = raw.split(/\s+/)[0] ?? '';
  const beforeParen = raw.split('(')[0]?.trim() ?? '';
  return [...new Set([raw, beforeParen, first].filter(Boolean))];
}

function parseDayOfWeek(dayText?: string | null): number | null {
  for (const candidate of dayCandidates(dayText)) {
    const key = normalizeToken(candidate);
    if (DAY_TOKENS[key] != null) return DAY_TOKENS[key];
    for (const [token, dow] of Object.entries(DAY_TOKENS)) {
      if (token.length >= 3 && key.startsWith(token)) return dow;
    }
  }
  return null;
}

function extractDayToken(timeRaw?: string | null): string | null {
  if (!timeRaw?.trim()) return null;
  for (const token of timeRaw.split(/\s+/)) {
    if (parseDayOfWeek(token) != null) return token;
  }
  return null;
}

function formatTime(hour: number, minute: number): string {
  const h = Math.max(0, Math.min(23, hour));
  const m = Math.max(0, Math.min(59, Math.floor(minute / 15) * 15));
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function parseHoursRange(hoursText?: string | null): {
  start: string | null;
  hours: number | null;
} {
  if (!hoursText?.trim()) return { start: null, hours: null };

  let match = hoursText.match(TIME_RANGE);
  if (match) {
    const sh = Number(match[1]);
    const sm = Number(match[2]);
    const eh = Number(match[3]);
    const em = Number(match[4]);
    const startMin = sh * 60 + sm;
    let endMin = eh * 60 + em;
    if (endMin <= startMin) endMin += 24 * 60;
    const hours = (endMin - startMin) / 60;
    return hours > 0 ? { start: formatTime(sh, sm), hours } : { start: formatTime(sh, sm), hours: null };
  }

  match = hoursText.match(HOUR_ONLY_RANGE);
  if (match) {
    const sh = Number(match[1]);
    const eh = Number(match[2]);
    let endMin = eh * 60;
    const startMin = sh * 60;
    if (endMin <= startMin) endMin += 24 * 60;
    const hours = (endMin - startMin) / 60;
    return hours > 0 ? { start: formatTime(sh, 0), hours } : { start: formatTime(sh, 0), hours: null };
  }

  match = hoursText.match(SINGLE_TIME);
  if (match) {
    return { start: formatTime(Number(match[1]), Number(match[2])), hours: 2 };
  }

  return { start: null, hours: null };
}

function extractHoursToken(timeRaw?: string | null): string | null {
  if (!timeRaw?.trim()) return null;
  const cleaned = stripSaptTokens(timeRaw);
  const range = cleaned.match(TIME_RANGE);
  if (range) return range[0];
  const hourOnly = cleaned.match(HOUR_ONLY_RANGE);
  if (hourOnly) return hourOnly[0];
  const single = cleaned.match(SINGLE_TIME);
  return single ? single[0] : null;
}

function tryParseSaptInterval(text?: string | null): number | null {
  if (!text?.trim()) return null;
  if (!/sapt/i.test(text)) return null;

  const trailing = text.match(/sapt[\s.\-_/]*(\d+)/i);
  if (trailing) return Number(trailing[1]);

  const leading = text.match(/(\d+)[\s.\-_/]*sapt/i);
  if (leading) return Number(leading[1]);

  return null;
}

function isEveryTwoWeeks(raw: string, normalized: string): boolean {
  if (
    normalized.includes('every') &&
    normalized.includes('week') &&
    (normalized.includes('2') || normalized.includes('two'))
  ) {
    return true;
  }
  return /every\s*(2|two)\s*week/i.test(raw);
}

function extractFrequencyToken(timeRaw?: string | null): string | null {
  if (!timeRaw?.trim()) return null;
  const saptMatch = timeRaw.match(/sapt[\s.\-_/]*\d+/i);
  if (saptMatch) return saptMatch[0].trim();
  if (isEveryTwoWeeks(timeRaw, normalizeToken(timeRaw))) return 'every 2 weeks';
  for (const token of timeRaw.split(/\s+/)) {
    const key = normalizeToken(token);
    if (/sapt|week|para|lunar|month|^par$|^impar$/i.test(key)) return token;
  }
  return null;
}

function containsToken(normalized: string, token: string): boolean {
  return new RegExp(`\\b${token}\\b`, 'i').test(normalized);
}

/** sapt. 1 = odd term weeks; sapt. 2 = even term weeks (both biweekly from period start). */
function parseFrequencyWithPhase(
  freq?: string | null,
  phaseSource?: string | null,
): { frequency: string; biweeklyPhase: number | null } {
  const combined = [freq, phaseSource].filter((s) => s?.trim()).join(' ');
  if (!combined.trim()) return { frequency: 'weekly', biweeklyPhase: null };

  const saptInterval = tryParseSaptInterval(combined);
  if (saptInterval === 1) return { frequency: 'biweekly', biweeklyPhase: 1 };
  if (saptInterval === 2) return { frequency: 'biweekly', biweeklyPhase: 2 };
  if (saptInterval != null && saptInterval > 2) return { frequency: 'biweekly', biweeklyPhase: null };

  const key = normalizeToken(combined);
  if (isEveryTwoWeeks(combined, key)) return { frequency: 'biweekly', biweeklyPhase: 1 };

  if (containsToken(key, 'impar') || containsToken(key, 'odd')) {
    return { frequency: 'biweekly', biweeklyPhase: 1 };
  }
  if (containsToken(key, 'par') || containsToken(key, 'even')) {
    return { frequency: 'biweekly', biweeklyPhase: 2 };
  }
  if (key.includes('para') || key.includes('biweek') || key.includes('altern')) {
    return { frequency: 'biweekly', biweeklyPhase: 1 };
  }
  if (key.includes('lunar') || key.includes('month')) return { frequency: 'monthly', biweeklyPhase: null };

  return { frequency: 'weekly', biweeklyPhase: null };
}

/** Use API-normalized day/time when present; frequency/phase always from scrape labels when available. */
export function resolveScrapedEventTiming(event: NormalizedScrapedEvent): ResolvedScrapedTiming {
  const phaseSource = [event.time, event.dayLabel, event.hoursLabel, event.frequencyLabel]
    .filter((s) => s?.trim())
    .join(' ');
  const { frequency: labelFrequency, biweeklyPhase: labelPhase } = parseFrequencyWithPhase(
    event.frequencyLabel?.trim() || extractFrequencyToken(event.time),
    phaseSource,
  );
  const labelBiweeklyPhase =
    labelFrequency === 'biweekly' ? (labelPhase === 2 ? 2 : 1) : null;

  if (event.timeParsed && event.dayOfWeek != null && event.startTimeLocal) {
    return {
      dayOfWeek: event.dayOfWeek,
      startTimeLocal: event.startTimeLocal,
      hoursPerSession: event.hoursPerSession ?? 2,
      frequency: labelFrequency,
      biweeklyPhase: labelBiweeklyPhase,
      timeParsed: true,
      timeParseWarning: event.timeParseWarning,
    };
  }

  const dayText = event.dayLabel?.trim() || extractDayToken(event.time);
  const hoursText = event.hoursLabel?.trim() || extractHoursToken(event.time);
  const dayOfWeek = parseDayOfWeek(dayText);
  const { start, hours } = parseHoursRange(hoursText);

  const timeParsed = dayOfWeek != null && !!start && hours != null;
  let timeParseWarning = event.timeParseWarning ?? null;
  if (!timeParsed) {
    const parts: string[] = [];
    if (dayOfWeek == null && dayText) parts.push('day');
    if (!start || hours == null) parts.push('time range');
    timeParseWarning =
      parts.length > 0
        ? `Could not parse ${parts.join(' and ')} from scraped cell.`
        : 'Time cell was empty or unrecognized.';
  }

  return {
    dayOfWeek,
    startTimeLocal: start,
    hoursPerSession: hours ?? 2,
    frequency: labelFrequency,
    biweeklyPhase: labelBiweeklyPhase,
    timeParsed,
    timeParseWarning,
  };
}

export function resolveScrapedEvents(events: NormalizedScrapedEvent[]): NormalizedScrapedEvent[] {
  return events.map((event) => {
    const resolved = resolveScrapedEventTiming(event);
    return {
      ...event,
      dayOfWeek: resolved.dayOfWeek ?? undefined,
      startTimeLocal: resolved.startTimeLocal ?? undefined,
      hoursPerSession: resolved.hoursPerSession,
      frequency: resolved.frequency,
      biweeklyPhase: resolved.biweeklyPhase ?? undefined,
      timeParsed: resolved.timeParsed,
      timeParseWarning: resolved.timeParseWarning ?? undefined,
    };
  });
}
