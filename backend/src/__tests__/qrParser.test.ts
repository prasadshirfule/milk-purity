import { describe, it } from 'node:test';
import assert from 'node:assert';

// Mirroring the parser test
const CUSTOMER_CODE_REGEX = /^[A-Z][0-9]{4}$/;

function parseCustomerQR(rawInput: string | null | undefined) {
  if (!rawInput || typeof rawInput !== 'string') {
    return { valid: false, error: 'Invalid MILKGUARD customer QR' };
  }
  const trimmed = rawInput.trim();
  if (!trimmed) {
    return { valid: false, error: 'Invalid MILKGUARD customer QR' };
  }

  let codeCandidate = trimmed;
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
      // Ignore URL parse failure
    }
  }

  codeCandidate = codeCandidate.replace(/^\/+|\/+$/g, '').toUpperCase();

  if (CUSTOMER_CODE_REGEX.test(codeCandidate)) {
    return { valid: true, customerCode: codeCandidate };
  }

  return { valid: false, error: 'Invalid MILKGUARD customer QR' };
}

describe('QR Parsing & URL Extraction Unit Tests', () => {
  it('extracts customerCode from full HTTPS domain URL', () => {
    const res = parseCustomerQR('https://milkguard.example.com/customer/A1024');
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.customerCode, 'A1024');
  });

  it('extracts customerCode from localhost development URL with query params', () => {
    const res = parseCustomerQR('http://localhost:5173/customer/B5831?ref=qr_scan#top');
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.customerCode, 'B5831');
  });

  it('extracts customerCode from relative path /customer/P0047', () => {
    const res = parseCustomerQR('/customer/P0047');
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.customerCode, 'P0047');
  });

  it('extracts customerCode from direct code string and normalizes to uppercase', () => {
    const res = parseCustomerQR('m2741');
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.customerCode, 'M2741');
  });

  it('rejects malformed URLs without valid customer code', () => {
    const res = parseCustomerQR('https://milkguard.example.com/customer/INVALID999');
    assert.strictEqual(res.valid, false);
    assert.strictEqual(res.error, 'Invalid MILKGUARD customer QR');
  });

  it('rejects random strings or external links', () => {
    const res = parseCustomerQR('https://google.com/search?q=milk');
    assert.strictEqual(res.valid, false);
    assert.strictEqual(res.error, 'Invalid MILKGUARD customer QR');
  });

  it('rejects null, undefined, or empty inputs', () => {
    assert.strictEqual(parseCustomerQR('').valid, false);
    assert.strictEqual(parseCustomerQR(null as any).valid, false);
    assert.strictEqual(parseCustomerQR(undefined as any).valid, false);
  });
});
