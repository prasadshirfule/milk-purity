export interface QRParseResult {
  valid: boolean;
  customerCode?: string;
  error?: string;
  rawInput: string;
}

export const CUSTOMER_CODE_REGEX = /^[A-Z][0-9]{4}$/;

/**
 * Validates and extracts a Customer Code from a raw scanned QR string or URL.
 * Supports:
 * - https://domain.com/customer/A1024
 * - https://domain.com/farmers/A1024
 * - /customer/A1024
 * - A1024
 * - Case-insensitivity (normalized to uppercase)
 * - Query parameters / hash stripping
 */
export function parseCustomerQR(rawInput: string | null | undefined): QRParseResult {
  if (!rawInput || typeof rawInput !== 'string') {
    return {
      valid: false,
      rawInput: String(rawInput || ''),
      error: 'Invalid MILKGUARD customer QR'
    };
  }

  const trimmed = rawInput.trim();
  if (!trimmed) {
    return {
      valid: false,
      rawInput: trimmed,
      error: 'Invalid MILKGUARD customer QR'
    };
  }

  let codeCandidate = trimmed;

  // Extract from potential path or full URL
  if (codeCandidate.includes('/customer/')) {
    const parts = codeCandidate.split('/customer/');
    codeCandidate = parts[parts.length - 1].split('?')[0].split('#')[0].trim();
  } else if (codeCandidate.includes('/customers/')) {
    const parts = codeCandidate.split('/customers/');
    codeCandidate = parts[parts.length - 1].split('?')[0].split('#')[0].trim();
  } else if (codeCandidate.includes('/farmers/')) {
    const parts = codeCandidate.split('/farmers/');
    codeCandidate = parts[parts.length - 1].split('?')[0].split('#')[0].trim();
  } else if (codeCandidate.startsWith('http://') || codeCandidate.startsWith('https://')) {
    try {
      const url = new URL(codeCandidate);
      const segments = url.pathname.split('/').filter(Boolean);
      codeCandidate = segments[segments.length - 1] || '';
    } catch {
      // Ignore URL parsing errors and test raw candidate
    }
  }

  // Remove leading/trailing slashes
  codeCandidate = codeCandidate.replace(/^\/+|\/+$/g, '');

  // Normalize to uppercase
  codeCandidate = codeCandidate.toUpperCase();

  // Validate format ^[A-Z][0-9]{4}$
  if (CUSTOMER_CODE_REGEX.test(codeCandidate)) {
    return {
      valid: true,
      customerCode: codeCandidate,
      rawInput: trimmed
    };
  }

  return {
    valid: false,
    rawInput: trimmed,
    error: 'Invalid MILKGUARD customer QR'
  };
}

/**
 * Generates the stable frontend customer profile URL for QR encoding.
 */
export function generateCustomerQRUrl(customerCode: string, baseUrl?: string): string {
  const code = (customerCode || '').trim().toUpperCase();
  const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  if (!base) {
    return `/customer/${code}`;
  }
  return `${base.replace(/\/+$/, '')}/customer/${code}`;
}
