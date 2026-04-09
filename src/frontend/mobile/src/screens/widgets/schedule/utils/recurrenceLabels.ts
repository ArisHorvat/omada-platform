export function formatRecurrenceLabel(freq: string, interval: number): string {
  if (freq === 'NONE') return 'Never';
  const unit = freq === 'DAILY' ? 'Day' : freq === 'WEEKLY' ? 'Week' : freq === 'MONTHLY' ? 'Month' : 'Year';
  if (interval === 1) return `Every ${unit}`;
  return `Every ${interval} ${unit}s`;
}
