/**
 * Utility functions for Brazilian phone number formatting and auto-organization
 */

/**
 * Removes all non-digit characters from a phone number string
 */
export function cleanPhone(raw: string): string {
  if (!raw) return '';
  return raw.replace(/\D/g, '');
}

export type PhoneType = 'celular' | 'fixo' | 'internacional' | 'incompleto';

/**
 * Identifies the type of Brazilian phone number
 */
export function getPhoneType(raw: string): PhoneType {
  const digits = cleanPhone(raw);
  if (!digits) return 'incompleto';

  const isDdi = raw.trim().startsWith('+') || (digits.startsWith('55') && digits.length >= 12);
  const national = isDdi && digits.startsWith('55') ? digits.slice(2) : digits;

  if (national.length < 10) return 'incompleto';
  const phoneBody = national.slice(2);
  if (phoneBody.startsWith('9')) return 'celular';
  return 'fixo';
}

/**
 * Formats a phone number dynamically as the user types.
 *
 * Rules:
 * - Mobile / WhatsApp: (XX) 9XXXX-XXXX (Always keeps 9 in first group: 9XXXX-XXXX)
 * - Landline (Fixo): (XX) XXXX-XXXX (e.g. (11) 3289-4400)
 * - International with Brazil DDI: +55 (XX) 9XXXX-XXXX or +55 (XX) XXXX-XXXX
 * - Dynamic formatting prevents digit jumping while user types digit by digit.
 */
export function formatPhone(raw: string): string {
  if (!raw) return '';

  const trimmed = raw.trim();
  const hasPlus = trimmed.startsWith('+');
  let digits = cleanPhone(trimmed);

  if (!digits) return hasPlus ? '+' : '';

  // Check if DDI +55 is present
  const isDdiBrazil = hasPlus || (digits.startsWith('55') && digits.length >= 12);
  let ddiPrefix = '';
  let nationalDigits = digits;

  if (isDdiBrazil) {
    ddiPrefix = '+55 ';
    if (digits.startsWith('55')) {
      nationalDigits = digits.slice(2);
    }
  }

  // Cap national digits to 11 (2 DDD + 9 mobile or 8 landline)
  nationalDigits = nationalDigits.slice(0, 11);

  if (nationalDigits.length === 0) {
    return ddiPrefix.trim();
  }

  // 1 or 2 digits: DDD in progress
  if (nationalDigits.length <= 2) {
    return `${ddiPrefix}(${nationalDigits}`;
  }

  const ddd = nationalDigits.slice(0, 2);
  const rest = nationalDigits.slice(2);

  // Check if mobile (starts with 9) or landline (starts with 2-8)
  const isMobile = rest.length > 0 && rest[0] === '9';

  if (isMobile) {
    // Mobile: (XX) 9XXXX-XXXX
    if (rest.length <= 5) {
      return `${ddiPrefix}(${ddd}) ${rest}`;
    }
    return `${ddiPrefix}(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5, 9)}`;
  } else {
    // Landline: (XX) XXXX-XXXX
    if (rest.length <= 4) {
      return `${ddiPrefix}(${ddd}) ${rest}`;
    }
    return `${ddiPrefix}(${ddd}) ${rest.slice(0, 4)}-${rest.slice(4, 8)}`;
  }
}

/**
 * Validates if the phone number has a complete valid Brazilian length
 */
export function isValidPhone(raw: string): boolean {
  const digits = cleanPhone(raw);
  if (digits.startsWith('55') && digits.length >= 12) {
    return digits.length === 12 || digits.length === 13;
  }
  return digits.length === 10 || digits.length === 11;
}

/**
 * Returns clean digits suitable for WhatsApp wa.me links (including 55 country code)
 */
export function getWhatsAppCleanNumber(phone: string): string {
  let clean = cleanPhone(phone);
  if ((clean.length === 10 || clean.length === 11) && !clean.startsWith('55')) {
    clean = `55${clean}`;
  }
  return clean;
}
