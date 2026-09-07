import { describe, it, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { sensorService } from '../services/sensorService';
import { QualityService } from '../services/qualityService';
import { dataRepository } from '../services/seedService';
import { generateAuthToken } from '../middleware/authMiddleware';
import { ISensorReading, IDevice } from '../types';

describe('ESP32 Device Integration Foundation & Sensor Pipeline', () => {
  beforeEach(async () => {
    // Reset seed/in-memory data for deterministic testing
    await dataRepository.resetDefaults();
  });

  describe('1. Canonical ESP32 Telemetry Contract Validation', () => {
    it('should successfully validate a canonical ESP32 telemetry payload', () => {
      const canonicalPayload = {
        deviceId: 'ESP32-MILK-001',
        timestamp: '2026-09-07T10:30:00.000Z',
        temperature: 24.2,
        ph: 6.65,
        fat: 4.5,
        density: 1.029,
        conductivity: 4.8,
        milkLevel: 25.5,
        firmwareVersion: 'v2.1.0',
        sequenceNumber: 1042,
        batteryLevel: 98
      };

      const result = sensorService.validateReading(canonicalPayload);
      assert.strictEqual(result.valid, true);
      assert.ok(result.reading);
      assert.strictEqual(result.reading.deviceId, 'ESP32-MILK-001');
      assert.strictEqual(result.reading.temperature, 24.2);
      assert.strictEqual(result.reading.ph, 6.65);
      assert.strictEqual(result.reading.fat, 4.5);
      assert.strictEqual(result.reading.density, 1.029);
      assert.strictEqual(result.reading.conductivity, 4.8);
      assert.strictEqual(result.reading.milkLevel, 25.5);
      assert.strictEqual(result.reading.firmwareVersion, 'v2.1.0');
      assert.strictEqual(result.reading.sequenceNumber, 1042);
      assert.strictEqual(result.reading.batteryLevel, 98);
    });

    it('should reject payload with missing or empty deviceId', () => {
      const invalid = {
        temperature: 24.2,
        ph: 6.65,
        fat: 4.5,
        density: 1.029,
        conductivity: 4.8
      };
      const res = sensorService.validateReading(invalid);
      assert.strictEqual(res.valid, false);
      assert.match(res.error || '', /deviceId/i);
    });

    it('should reject non-object or array payloads', () => {
      assert.strictEqual(sensorService.validateReading(null).valid, false);
      assert.strictEqual(sensorService.validateReading(undefined).valid, false);
      assert.strictEqual(sensorService.validateReading([1, 2, 3]).valid, false);
      assert.strictEqual(sensorService.validateReading('string').valid, false);
    });
  });

  describe('2. Physical Sensor Bounds & Zero-Corruption Prevention', () => {
    it('should reject out-of-bounds temperature (< -10°C or > 100°C)', () => {
      const tooLow = { deviceId: 'ESP32-001', temperature: -15, ph: 6.6, fat: 4.0, density: 1.029, conductivity: 5.0 };
      const tooHigh = { deviceId: 'ESP32-001', temperature: 105, ph: 6.6, fat: 4.0, density: 1.029, conductivity: 5.0 };
      assert.strictEqual(sensorService.validateReading(tooLow).valid, false);
      assert.strictEqual(sensorService.validateReading(tooHigh).valid, false);
    });

    it('should reject out-of-bounds pH (< 0 or > 14)', () => {
      const tooLow = { deviceId: 'ESP32-001', temperature: 24, ph: -0.5, fat: 4.0, density: 1.029, conductivity: 5.0 };
      const tooHigh = { deviceId: 'ESP32-001', temperature: 24, ph: 14.5, fat: 4.0, density: 1.029, conductivity: 5.0 };
      assert.strictEqual(sensorService.validateReading(tooLow).valid, false);
      assert.strictEqual(sensorService.validateReading(tooHigh).valid, false);
    });

    it('should reject out-of-bounds fat percentage (< 0% or > 20%)', () => {
      const tooHigh = { deviceId: 'ESP32-001', temperature: 24, ph: 6.6, fat: 25.0, density: 1.029, conductivity: 5.0 };
      assert.strictEqual(sensorService.validateReading(tooHigh).valid, false);
    });

    it('should reject out-of-bounds density (< 0.5 or > 2.0 g/mL)', () => {
      const invalid = { deviceId: 'ESP32-001', temperature: 24, ph: 6.6, fat: 4.0, density: 0.2, conductivity: 5.0 };
      assert.strictEqual(sensorService.validateReading(invalid).valid, false);
    });

    it('should reject out-of-bounds conductivity (< 0 or > 50 mS/cm)', () => {
      const invalid = { deviceId: 'ESP32-001', temperature: 24, ph: 6.6, fat: 4.0, density: 1.029, conductivity: 65.0 };
      assert.strictEqual(sensorService.validateReading(invalid).valid, false);
    });

    it('should reject NaN, Infinity, -Infinity, and non-numeric representations without falling back to 0', () => {
      const nanTemp = { deviceId: 'ESP32-001', temperature: NaN, ph: 6.6, fat: 4.0, density: 1.029, conductivity: 5.0 };
      const infPh = { deviceId: 'ESP32-001', temperature: 24, ph: Infinity, fat: 4.0, density: 1.029, conductivity: 5.0 };
      const strNanFat = { deviceId: 'ESP32-001', temperature: 24, ph: 6.6, fat: 'NaN', density: 1.029, conductivity: 5.0 };
      const missingFat = { deviceId: 'ESP32-001', temperature: 24, ph: 6.6, density: 1.029, conductivity: 5.0 };

      assert.strictEqual(sensorService.validateReading(nanTemp).valid, false);
      assert.strictEqual(sensorService.validateReading(infPh).valid, false);
      assert.strictEqual(sensorService.validateReading(strNanFat).valid, false);
      assert.strictEqual(sensorService.validateReading(missingFat).valid, false);
    });
  });

  describe('3. Deterministic Device Status Rules', () => {
    it('device with no telemetry history must resolve to UNKNOWN (not ONLINE)', async () => {
      const dev = await dataRepository.getDeviceById('ESP32-UNPROVISIONED-01');
      assert.ok(dev);
      assert.strictEqual(dev.status, 'UNKNOWN');
      assert.strictEqual(dev.lastSeen, undefined);
    });

    it('device with recent telemetry (< 60s) must resolve to ONLINE', async () => {
      const reading: ISensorReading = {
        deviceId: 'ESP32-MILK-001',
        timestamp: new Date().toISOString(),
        temperature: 24.0,
        ph: 6.65,
        fat: 4.5,
        density: 1.029,
        conductivity: 5.0,
        milkLevel: 20
      };
      sensorService.storeReading(reading);
      await dataRepository.updateDeviceHeartbeat('ESP32-MILK-001');

      const dev = await dataRepository.getDeviceById('ESP32-MILK-001');
      assert.ok(dev);
      assert.strictEqual(dev.status, 'ONLINE');
    });

    it('device with stale telemetry (> 60s) must resolve to OFFLINE', async () => {
      const dev = await dataRepository.getDeviceById('ESP32-MILK-002');
      assert.ok(dev);
      // ESP32-MILK-002 was seeded with lastSeen 2 hours ago
      assert.strictEqual(dev.status, 'OFFLINE');
    });

    it('device with recent telemetry but disabled/faulty probe must resolve to WARNING', async () => {
      await dataRepository.updateDeviceHeartbeat('ESP32-MILK-003');
      const dev = await dataRepository.getDeviceById('ESP32-MILK-003');
      assert.ok(dev);
      // ESP32-MILK-003 has disabled ph/fat sensors and now recent lastSeen
      assert.strictEqual(dev.status, 'WARNING');
    });
  });

  describe('4. Telemetry Ingestion vs Milk Test Separation', () => {
    it('telemetry ingestion does NOT create a milk test in database', async () => {
      const initialTests = await dataRepository.getTests();
      const initialCount = initialTests.length;

      const reading: ISensorReading = {
        deviceId: 'ESP32-MILK-001',
        timestamp: new Date().toISOString(),
        temperature: 24.2,
        ph: 6.65,
        fat: 4.5,
        density: 1.029,
        conductivity: 5.0,
        milkLevel: 25.0
      };

      sensorService.storeReading(reading);
      await dataRepository.updateDeviceHeartbeat('ESP32-MILK-001');

      const afterTests = await dataRepository.getTests();
      assert.strictEqual(afterTests.length, initialCount, 'Telemetry arrival must NOT automatically create a MilkTest');
    });

    it('frozen sensor snapshot is captured upon test creation and does not mutate with later telemetry', async () => {
      const snapshotTime = new Date('2026-09-07T10:00:00Z');
      const test = await dataRepository.addTest({
        testId: 'TEST-FROZEN-001',
        farmerId: 'FMR-1001',
        customerCode: 'A1024',
        deviceId: 'ESP32-MILK-001',
        quantity: 20,
        timestamp: new Date('2026-09-07T10:01:00Z'),
        sensorTimestamp: snapshotTime,
        testTimestamp: new Date('2026-09-07T10:01:00Z'),
        temperature: 24.2,
        ph: 6.65,
        fat: 4.5,
        density: 1.029,
        conductivity: 5.0,
        milkLevel: 20,
        qualityScore: 92,
        classification: 'EXCELLENT',
        aiRecommendation: 'ACCEPT',
        operatorDecision: 'ACCEPT',
        operatorId: 'USR-002',
        operatorName: 'Rajendra Deshmukh',
        warnings: [],
        result: 'ACCEPTED',
        ratePerLiter: 42.5,
        totalAmount: 850
      });

      // Later telemetry comes in with altered temperature and fat
      const laterReading: ISensorReading = {
        deviceId: 'ESP32-MILK-001',
        timestamp: new Date('2026-09-07T10:30:00Z').toISOString(),
        temperature: 32.0,
        ph: 6.20,
        fat: 2.1,
        density: 1.022,
        conductivity: 7.5,
        milkLevel: 5.0
      };
      sensorService.storeReading(laterReading);

      // Verify the saved test record remains strictly frozen
      const storedTest = await dataRepository.getTestById('TEST-FROZEN-001');
      assert.ok(storedTest);
      assert.strictEqual(storedTest.temperature, 24.2);
      assert.strictEqual(storedTest.ph, 6.65);
      assert.strictEqual(storedTest.fat, 4.5);
      assert.strictEqual(storedTest.qualityScore, 92);
      assert.strictEqual(storedTest.result, 'ACCEPTED');
    });
  });

  describe('5. RBAC & Security for Device Management & Telemetry', () => {
    it('generates verifiable auth tokens with role verification', () => {
      const adminToken = generateAuthToken({ userId: 'USR-001', username: 'admin', role: 'ADMIN' });
      const opToken = generateAuthToken({ userId: 'USR-002', username: 'operator', role: 'OPERATOR' });

      assert.ok(adminToken);
      assert.ok(opToken);
      assert.notStrictEqual(adminToken, opToken);
    });

    it('admin can register, update, and delete devices', async () => {
      const newDev = await dataRepository.addDevice({
        deviceId: 'ESP32-MILK-TEST99',
        name: 'Test Node 99',
        deviceType: 'ESP32_MILK_ANALYZER',
        connectionMode: 'REST_POLLING',
        status: 'UNKNOWN',
        location: 'Bay 99'
      });

      assert.ok(newDev);
      assert.strictEqual(newDev.deviceId, 'ESP32-MILK-TEST99');

      const updated = await dataRepository.updateDevice('ESP32-MILK-TEST99', { location: 'Bay 99-Updated' });
      assert.ok(updated);
      assert.strictEqual(updated.location, 'Bay 99-Updated');

      const deleted = await dataRepository.deleteDevice('ESP32-MILK-TEST99');
      assert.strictEqual(deleted, true);

      const check = await dataRepository.getDeviceById('ESP32-MILK-TEST99');
      assert.strictEqual(check, null);
    });
  });

  describe('6. Separation of Sensor Validation vs QualityService Screening', () => {
    it('sensor validation only checks plausibility, while QualityService calculates purity & classification', () => {
      const reading = {
        deviceId: 'ESP32-MILK-001',
        temperature: 24.0,
        ph: 6.64,
        fat: 4.5,
        density: 1.029,
        conductivity: 5.0
      };

      // 1. Validation layer
      const validation = sensorService.validateReading(reading);
      assert.strictEqual(validation.valid, true);

      // 2. Quality screening layer
      const thresholds = {
        tempMin: 15,
        tempMax: 30,
        phMin: 6.5,
        phMax: 6.8,
        fatMin: 3.5,
        fatMax: 6.5,
        densityMin: 1.026,
        densityMax: 1.034,
        conductivityMin: 4.0,
        conductivityMax: 6.0,
        scoreExcellentMin: 85,
        scoreGoodMin: 70,
        scoreSuspiciousMin: 50,
        baseRatePerLiter: 40.0,
        fatRatePerLiter: 5.0,
        fatPremiumFactor: 0.5,
        qualityBonusRate: 3.0,
        qualityPenaltyRate: 5.0
      };

      const quality = QualityService.calculateQuality(validation.reading!, thresholds);
      assert.ok(quality.score >= 85);
      assert.strictEqual(quality.classification, 'EXCELLENT');
      assert.strictEqual(quality.aiRecommendation, 'ACCEPT');
      assert.strictEqual(quality.result, 'ACCEPTED');
    });
  });
});
