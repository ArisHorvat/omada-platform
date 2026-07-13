export function normalizeGuid(value?: string | null): string {
  if (!value) return '';
  return value.trim().toLowerCase();
}

export function guidsEqual(a?: string | null, b?: string | null): boolean {
  const left = normalizeGuid(a);
  const right = normalizeGuid(b);
  return !!left && !!right && left === right;
}
