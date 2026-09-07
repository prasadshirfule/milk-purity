import { describe, it, beforeEach } from 'node:test';
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

  describe('3. Sequence Number Ordering & Duplicate Telemetry Handling', () => {
    it('NEWER sequence packet is accepted and updates the latest reading', () => {
      const devId = 'ESP32-SEQ-001';
      const packet1: ISensorReading = {
        deviceId: devId,
        sequenceNumber: 100,
        timestamp: '2026-09-07T10:00:00Z',
        temperature: 24.0,
        ph: 6.65,
        fat: 4.2,
        density: 1.029,
        conductivity: 4.9,
        milkLevel: 20
      };
      const res1 = sensorService.storeReading(packet1);
      assert.strictEqual(res1.status, 'ACCEPTED');
      assert.strictEqual(res1.current.fat, 4.2);

      const packet2: ISensorReading = {
        deviceId: devId,
        sequenceNumber: 101,
        timestamp: '2026-09-07T10:00:02Z',
        temperature: 24.1,
        ph: 6.66,
        fat: 4.5,
        density: 1.030,
        conductivity: 5.0,
        milkLevel: 20
      };
      const res2 = sensorService.storeReading(packet2);
      assert.strictEqual(res2.status, 'ACCEPTED');
      assert.strictEqual(res2.current.fat, 4.5);
      assert.strictEqual(res2.current.sequenceNumber, 101);
    });

    it('SAME sequence packet is treated as duplicate/idempotent and does not overwrite state', () => {
      const devId = 'ESP32-SEQ-002';
      const packetOriginal: ISensorReading = {
        deviceId: devId,
        sequenceNumber: 200,
        timestamp: '2026-09-07T10:05:00Z',
        temperature: 24.2,
        ph: 6.64,
        fat: 4.3,
        density: 1.029,
        conductivity: 4.8,
        milkLevel: 25
      };
      sensorService.storeReading(packetOriginal);

      // Duplicate packet with same sequence number
      const packetDuplicate: ISensorReading = {
        deviceId: devId,
        sequenceNumber: 200,
        timestamp: '2026-09-07T10:05:00Z',
        temperature: 30.0, // Modified attempt
        ph: 6.0,
        fat: 2.0,
        density: 1.020,
        conductivity: 7.0,
        milkLevel: 25
      };
      const resDup = sensorService.storeReading(packetDuplicate);
      assert.strictEqual(resDup.status, 'DUPLICATE');

      // Verify the latest reading remains the original
      const latest = sensorService.getLatestReading(devId);
      assert.ok(latest);
      assert.strictEqual(latest.fat, 4.3);
      assert.strictEqual(latest.temperature, 24.2);
    });

    it('OLDER sequence packet is rejected and CANNOT overwrite a newer latest reading', () => {
      const devId = 'ESP32-SEQ-003';
      const packetNew: ISensorReading = {
        deviceId: devId,
        sequenceNumber: 305,
        timestamp: '2026-09-07T10:10:05Z',
        temperature: 24.5,
        ph: 6.65,
        fat: 4.6,
        density: 1.0295,
        conductivity: 4.9,
        milkLevel: 30
      };
      sensorService.storeReading(packetNew);

      // Delayed/out-of-order packet with older sequence number
      const packetOld: ISensorReading = {
        deviceId: devId,
        sequenceNumber: 301,
        timestamp: '2026-09-07T10:10:01Z',
        temperature: 22.0,
        ph: 6.50,
        fat: 3.8,
        density: 1.028,
        conductivity: 5.2,
        milkLevel: 30
      };
      const resOld = sensorService.storeReading(packetOld);
      assert.strictEqual(resOld.status, 'OUT_OF_ORDER');

      // Verify latest reading was preserved from seq 305
      const latest = sensorService.getLatestReading(devId);
      assert.ok(latest);
      assert.strictEqual(latest.sequenceNumber, 305);
      assert.strictEqual(latest.fat, 4.6);
    });

    it('older timestamp packet cannot overwrite newer timestamp packet when sequenceNumber is omitted', () => {
      const devId = 'ESP32-TIME-001';
      const packetNew: ISensorReading = {
        deviceId: devId,
        timestamp: '2026-09-07T10:20:00Z',
        temperature: 24.2,
        ph: 6.64,
        fat: 4.4,
        density: 1.029,
        conductivity: 5.0,
        milkLevel: 15
      };
      sensorService.storeReading(packetNew);

      const packetOld: ISensorReading = {
        deviceId: devId,
        timestamp: '2026-09-07T10:15:00Z', // 5 minutes older
        temperature: 26.0,
        ph: 6.30,
        fat: 3.0,
        density: 1.025,
        conductivity: 6.0,
        milkLevel: 15
      };
      const resOld = sensorService.storeReading(packetOld);
      assert.strictEqual(resOld.status, 'OUT_OF_ORDER');

      const latest = sensorService.getLatestReading(devId);
      assert.ok(latest);
      assert.strictEqual(latest.fat, 4.4);
    });
  });

  describe('4. Deterministic Device Status Rules', () => {
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

  describe('5. Telemetry Ingestion vs Milk Test Separation & Snapshot Freezing', () => {
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

  describe('6. Device Management & Non-Destructive Deactivation', () => {
    it('generates verifiable auth tokens with role verification', () => {
      const adminToken = generateAuthToken({ userId: 'USR-001', username: 'admin', role: 'ADMIN' });
      const opToken = generateAuthToken({ userId: 'USR-002', username: 'operator', role: 'OPERATOR' });

      assert.ok(adminToken);
      assert.ok(opToken);
      assert.notStrictEqual(adminToken, opToken);
    });

    it('admin can register, update, and deactivate devices without affecting historical milk tests', async () => {
      // 1. Register device
      const newDev = await dataRepository.addDevice({
        deviceId: 'ESP32-MILK-TEST99',
        name: 'Test Node 99',
        deviceType: 'ESP32_MILK_ANALYZER',
        connectionMode: 'REST_POLLING',
        status: 'UNKNOWN',
        location: 'Bay 99'
      });
      assert.ok(newDev);

      // 2. Associate historical milk test with this device
      await dataRepository.addTest({
        testId: 'TEST-DEV-HIST-001',
        farmerId: 'FMR-1001',
        customerCode: 'A1024',
        deviceId: 'ESP32-MILK-TEST99',
        quantity: 15,
        timestamp: new Date(),
        temperature: 24.0,
        ph: 6.65,
        fat: 4.4,
        density: 1.029,
        conductivity: 5.0,
        milkLevel: 15,
        qualityScore: 90,
        classification: 'EXCELLENT',
        warnings: [],
        result: 'ACCEPTED',
        ratePerLiter: 42.0,
        totalAmount: 630
      });

      // 3. Deactivate/remove device
      const deleted = await dataRepository.deleteDevice('ESP32-MILK-TEST99');
      assert.strictEqual(deleted, true);

      // 4. Verify historical milk test still exists intact and auditability is preserved
      const historicalTest = await dataRepository.getTestById('TEST-DEV-HIST-001');
      assert.ok(historicalTest);
      assert.strictEqual(historicalTest.deviceId, 'ESP32-MILK-TEST99');
      assert.strictEqual(historicalTest.totalAmount, 630);
    });
  });

  describe('7. Separation of Sensor Validation vs QualityService Screening', () => {
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
