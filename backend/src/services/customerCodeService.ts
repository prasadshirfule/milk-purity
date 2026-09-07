import { IFarmer } from '../types';

export class CustomerCodeService {
  public static readonly CODE_REGEX = /^[A-Z][0-9]{4}$/;

  /**
   * Validates whether a customer code conforms to the exact format:
   * 1 uppercase alphabet letter followed by 4 digits (e.g. A1024, B5831, P0047).
   */
  public static isValidFormat(code: any): boolean {
    if (typeof code !== 'string') return false;
    return this.CODE_REGEX.test(code.trim());
  }

  /**
   * Generates a collision-free customer code (A-Z + 4 digits: e.g. A1024)
   * against an existing set of assigned customer codes.
   */
  public static generateUniqueCode(existingCodes: Set<string>): string {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const maxRetries = 100;

    for (let i = 0; i < maxRetries; i++) {
      const letter = letters[Math.floor(Math.random() * letters.length)];
      const number = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      const candidate = `${letter}${number}`;

      if (!existingCodes.has(candidate)) {
        existingCodes.add(candidate);
        return candidate;
      }
    }

    // Deterministic fallback scanning if random attempts encounter high density
    for (let l = 0; l < letters.length; l++) {
      const letter = letters[l];
      for (let n = 0; n <= 9999; n++) {
        const candidate = `${letter}${n.toString().padStart(4, '0')}`;
        if (!existingCodes.has(candidate)) {
          existingCodes.add(candidate);
          return candidate;
        }
      }
    }

    throw new Error('Customer code namespace exhausted (260,000 maximum codes reached).');
  }

  /**
   * Idempotent migration/backfill helper for existing farmer/customer records.
   * Preserves existing valid codes and assigns fresh unique codes to missing records.
   */
  public static backfillCustomerCodes(farmers: IFarmer[]): IFarmer[] {
    const existingCodes = new Set<string>();

    // Pass 1: Collect existing valid codes
    for (const f of farmers) {
      if (f.customerCode && this.isValidFormat(f.customerCode)) {
        existingCodes.add(f.customerCode.trim().toUpperCase());
      }
    }

    // Pass 2: Assign unique codes to records lacking one
    for (const f of farmers) {
      if (!f.customerCode || !this.isValidFormat(f.customerCode)) {
        const newCode = this.generateUniqueCode(existingCodes);
        f.customerCode = newCode;
      } else {
        f.customerCode = f.customerCode.trim().toUpperCase();
      }
    }

    return farmers;
  }
}
