/** Formats a 12-digit barcode as grouped member ID (e.g. 8829 1045 1201). */
export function formatMemberId(barcodeValue: string): string {
  const digits = barcodeValue.replace(/\D/g, '');
  if (digits.length <= 4) return digits;
  if (digits.length <= 8) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
  return `${digits.slice(0, 4)} ${digits.slice(4, 8)} ${digits.slice(8)}`;
}

export function memberIdSuffix(barcodeValue: string, len = 4): string {
  const digits = barcodeValue.replace(/\D/g, '');
  return digits.slice(-len);
}
