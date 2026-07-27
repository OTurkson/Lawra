/**
 * Formats a numeric string by adding thousand separators (commas).
 * Allows one decimal point. Returns the formatted string.
 *
 * Example: "1234.56" → "1,234.56"
 */
export function formatNumberInput(value: string): string {
  // Remove existing commas
  const raw = value.replace(/,/g, '');

  // Only allow digits and at most one decimal point
  if (!/^\d*\.?\d*$/.test(raw)) return value;

  const parts = raw.split('.');
  const integerPart = parts[0];
  const decimalPart = parts.length > 1 ? `.${parts[1]}` : '';

  // Add thousand separators
  const formatted = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  return formatted + decimalPart;
}

/**
 * Strips commas from a formatted amount string and returns the raw numeric string.
 * Returns empty string if input is empty.
 */
export function parseAmount(formatted: string): string {
  return formatted.replace(/,/g, '');
}

/**
 * Formats a number to a currency string with thousand separators and 2 decimal places.
 * Example: 1234567.8 → "1,234,567.80"
 */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return 'Gh¢ -';
  return `Gh¢ ${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}