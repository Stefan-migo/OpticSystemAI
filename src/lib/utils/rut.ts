/**
 * Utility functions for Chilean RUT (Rol Único Tributario) formatting and validation
 */

/**
 * Formats a Chilean RUT to the standard format: xx.xxx.xxx-x
 * Accepts RUT in any format (with or without dots/dashes) and normalizes it
 *
 * @param rut - RUT string in any format (e.g., "123456789", "12.345.678-9", "12345678-9")
 * @returns Formatted RUT string in format "xx.xxx.xxx-x" or empty string if invalid
 *
 * @example
 * formatRUT("123456789") // Returns "12.345.678-9"
 * formatRUT("12.345.678-9") // Returns "12.345.678-9"
 * formatRUT("12345678-9") // Returns "12.345.678-9"
 */
export function formatRUT(rut: string): string {
  if (!rut) return "";

  // Remove all non-numeric characters except K (verification digit can be K)
  const cleanRUT = rut.replace(/[^0-9Kk]/g, "");

  if (cleanRUT.length === 0) return "";

  // Extract verification digit (last character)
  const verificationDigit = cleanRUT.slice(-1).toUpperCase();
  // Extract numbers (everything except last character)
  const numbers = cleanRUT.slice(0, -1);

  if (numbers.length === 0) return verificationDigit;

  // Format numbers with dots (Chilean format: thousands separator)
  // This regex adds dots every 3 digits from right to left
  const formatted = numbers.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

  // Add dash and verification digit
  return `${formatted}-${verificationDigit}`;
}

/**
 * Normalizes a RUT by removing all formatting (dots, dashes, spaces)
 * Useful for database storage or comparison
 *
 * @param rut - RUT string in any format
 * @returns RUT string without formatting (e.g., "123456789")
 */
export function normalizeRUT(rut: string): string {
  if (!rut) return "";
  return rut.replace(/[.\-\s]/g, "").toUpperCase();
}

/**
 * Validates if a RUT has a valid format (basic format check, not verification digit validation)
 *
 * @param rut - RUT string to validate
 * @returns true if format is valid, false otherwise
 */
export function isValidRUTFormat(rut: string): boolean {
  if (!rut) return false;

  const normalized = normalizeRUT(rut);
  // RUT should have 7-8 digits + 1 verification digit (K or 0-9)
  return /^[0-9]{7,8}[0-9Kk]$/.test(normalized);
}
