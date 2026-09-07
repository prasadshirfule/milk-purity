import crypto from 'crypto';

/**
 * MILKGUARD Device Security & Telemetry Protection Utilities
 */

/**
 * Hashes a device secret key using SHA-256 with a standard prefix.
 */
export function hashDeviceSecret(secret: string): string {
  if (!secret || typeof secret !== 'string') return '';
  const hash = crypto.createHash('sha256').update(secret.trim()).digest('hex');
  return `sha256:${hash}`;
}

/**
 * Verifies a supplied plain device secret against stored hash or legacy plaintext key.
 * Uses timingSafeEqual to prevent timing side-channel attacks.
 */
export function verifyDeviceSecret(suppliedSecret: string, storedHashOrSecret?: string): boolean {
  if (!suppliedSecret || !storedHashOrSecret) return false;

  const trimmedSupplied = suppliedSecret.trim();
  const trimmedStored = storedHashOrSecret.trim();

  // If stored value is a sha256 hash
  if (trimmedStored.startsWith('sha256:')) {
    const suppliedHash = hashDeviceSecret(trimmedSupplied);
    if (suppliedHash.length !== trimmedStored.length) return false;
    try {
      return crypto.timingSafeEqual(Buffer.from(suppliedHash), Buffer.from(trimmedStored));
    } catch {
      return false;
    }
  }

  // If stored value is legacy plaintext or direct match
  if (trimmedSupplied.length === trimmedStored.length) {
    try {
      return crypto.timingSafeEqual(Buffer.from(trimmedSupplied), Buffer.from(trimmedStored));
    } catch {
      return false;
    }
  }

  return false;
}

/**
 * Generates a cryptographically strong unique device secret.
 */
export function generateDeviceSecret(deviceId: string): string {
  const cleanId = deviceId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
  const randomPart = crypto.randomBytes(24).toString('hex');
  return `dev_sec_${cleanId}_${randomPart}`;
}

/**
 * In-memory per-device telemetry rate limiter.
 * Protects telemetry ingestion endpoints from runaway loops or device flooding.
 */
interface RateTracker {
  count: number;
  windowStart: number;
  lastRequestTime: number;
}

const deviceRateMap = new Map<string, RateTracker>();

export function checkDeviceTelemetryRateLimit(
  deviceId: string,
  maxRequestsPerWindow = 60,
  windowMs = 1000
): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now();
  let tracker = deviceRateMap.get(deviceId);

  if (!tracker || now - tracker.windowStart > windowMs) {
    tracker = { count: 1, windowStart: now, lastRequestTime: now };
    deviceRateMap.set(deviceId, tracker);
    return { allowed: true };
  }

  if (tracker.count >= maxRequestsPerWindow) {
    const resetTime = tracker.windowStart + windowMs;
    return { allowed: false, retryAfterMs: Math.max(1, resetTime - now) };
  }

  tracker.count++;
  tracker.lastRequestTime = now;
  return { allowed: true };
}

export function resetDeviceRateLimits(): void {
  deviceRateMap.clear();
}
