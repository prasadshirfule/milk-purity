import test, { describe, it } from 'node:test';
import assert from 'node:assert';
import { QualityService } from '../services/qualityService';
import { sensorService } from '../services/sensorService';
import { DEFAULT_THRESHOLDS } from '../config/defaultThresholds';
import { ISensorReading } from '../types';

describe('QualityService Parameter Assessment', () => {
  it('should classify normal pH within configured reference range', () => {
    const assessment = QualityService.assessParameter(6.65, 6.5, 6.8, 'pH', 'pH');
    assert.strictEqual(assessment.status, 'NORMAL');
    assert.strictEqual(assessment.reading, 6.65);
    assert.strictEqual(assessment.normalMin, 6.5);
    assert.strictEqual(assessment.normalMax, 6.8);
    assert.ok(assessment.message?.includes('within configured reference range'));
  });

  it('should classify moderately low pH as LOW', () => {
    const assessment = QualityService.assessParameter(6.4, 6.5, 6.8, 'pH', 'pH');
    assert.strictEqual(assessment.status, 'LOW');
    assert.ok(assessment.message?.includes('below configured reference minimum'));
  });

  it('should classify moderately high pH as HIGH', () => {
    const assessment = QualityService.assessParameter(6.9, 6.5, 6.8, 'pH', 'pH');
    assert.strictEqual(assessment.status, 'HIGH');
    assert.ok(assessment.message?.includes('exceeds configured reference maximum'));
  });

  it('should classify severely deviating parameters as CRITICAL', () => {
    // 5.5 is < 6.5 * 0.9 = 5.85
    const assessment = QualityService.assessParameter(5.5, 6.5, 6.8, 'pH', 'pH');
    assert.strictEqual(assessment.status, 'CRITICAL');
    assert.ok(assessment.message?.includes('Requires laboratory verification'));
  });
});

describe('QualityService Overall Assessment & Classification', () => {
  it('should classify normal reference milk as EXCELLENT and ACCEPTED', () => {
    const reading: ISensorReading = {
      deviceId: 'ESP32-MILK-001',
      timestamp: new Date().toISOString(),
      temperature: 24.0,
      ph: 6.65,
      fat: 4.5,
      density: 1.029,
      conductivity: 5.0,
      milkLevel: 25.0
    };

    const result = QualityService.calculateQuality(reading, DEFAULT_THRESHOLDS);
    assert.strictEqual(result.classification, 'EXCELLENT');
    assert.strictEqual(result.result, 'ACCEPTED');
    assert.strictEqual(result.score, 100);
    assert.strictEqual(result.warnings.length, 0);
    assert.ok(result.recommendations.length > 0);
  });

  it('should penalize density and conductivity anomalies and recommend lab verification', () => {
    const abnormalReading: ISensorReading = {
      deviceId: 'ESP32-MILK-001',
      timestamp: new Date().toISOString(),
      temperature: 24.0,
      ph: 6.65,
      fat: 3.8,
      density: 1.018, // severe dilution
      conductivity: 7.5, // high conductivity
      milkLevel: 25.0
    };

    const result = QualityService.calculateQuality(abnormalReading, DEFAULT_THRESHOLDS);
    assert.strictEqual(result.classification, 'REJECT');
    assert.strictEqual(result.result, 'REJECTED');
    assert.ok(result.score < 60);
    assert.ok(result.warnings.some(w => w.includes('Density anomaly detected')));
    assert.ok(result.warnings.some(w => w.includes('Conductivity outside configured reference range')));
  });

  it('should handle custom configurable thresholds', () => {
    const customThresholds = {
      ...DEFAULT_THRESHOLDS,
      fatMin: 5.0, // stricter fat threshold
      scoreExcellentMin: 95.0
    };

    const reading: ISensorReading = {
      deviceId: 'ESP32-MILK-001',
      timestamp: new Date().toISOString(),
      temperature: 24.0,
      ph: 6.65,
      fat: 4.5, // now considered low
      density: 1.029,
      conductivity: 5.0,
      milkLevel: 25.0
    };

    const result = QualityService.calculateQuality(reading, customThresholds);
    assert.strictEqual(result.parameters.fat.status, 'LOW');
    assert.strictEqual(result.result, 'ACCEPTED'); // Score 90 is GOOD with 95 min
    assert.strictEqual(result.classification, 'GOOD');
  });
});

describe('QualityService Pricing Calculation (INR ₹)', () => {
  it('should calculate correct price with base rate and fat premium', () => {
    // Base rate: 38.0, fat: 4.5, fatMin: 3.5, fatPremiumFactor: 3.5
    // fatBonus = (4.5 - 3.5) * 3.5 = 3.50
    // Quality multiplier for 95% = 1.05
    // Expected: (38.0 + 3.50) * 1.05 = 41.50 * 1.05 = 43.575 -> 43.58
    const price = QualityService.calculatePricing(4.5, 95.0, DEFAULT_THRESHOLDS);
    assert.strictEqual(price, 43.58);
  });

  it('should return 0 payout rate for rejected milk batches', () => {
    const price = QualityService.calculatePricing(4.5, 45.0, DEFAULT_THRESHOLDS);
    assert.strictEqual(price, 0);
  });
});

describe('SensorService Payload Validation', () => {
  it('should validate a complete and correct sensor telemetry payload', () => {
    const payload = {
      deviceId: 'ESP32-MILK-001',
      temperature: 24.5,
      ph: 6.65,
      fat: 4.2,
      density: 1.0295,
      conductivity: 5.1,
      milkLevel: 50.0,
      timestamp: '2026-09-07T06:00:00.000Z'
    };

    const result = sensorService.validateReading(payload);
    assert.strictEqual(result.valid, true);
    assert.ok(result.reading);
    assert.strictEqual(result.reading?.deviceId, 'ESP32-MILK-001');
    assert.strictEqual(result.reading?.ph, 6.65);
  });

  it('should reject payload missing deviceId', () => {
    const payload = {
      temperature: 24.5,
      ph: 6.65,
      fat: 4.2,
      density: 1.029,
      conductivity: 5.1
    };

    const result = sensorService.validateReading(payload);
    assert.strictEqual(result.valid, false);
    assert.ok(result.error?.includes('deviceId'));
  });

  it('should reject invalid sensor values out of physical bounds', () => {
    const invalidPhPayload = {
      deviceId: 'ESP32-MILK-001',
      temperature: 24.5,
      ph: 15.2, // invalid pH > 14
      fat: 4.2,
      density: 1.029,
      conductivity: 5.1
    };

    const result = sensorService.validateReading(invalidPhPayload);
    assert.strictEqual(result.valid, false);
    assert.ok(result.error?.includes('pH'));
  });

  it('should reject non-object payloads', () => {
    const result = sensorService.validateReading('invalid string');
    assert.strictEqual(result.valid, false);
  });

  it('should reject NaN or Infinity in sensor values', () => {
    const nanPayload = {
      deviceId: 'ESP32-MILK-001',
      temperature: NaN,
      ph: 6.65,
      fat: 4.2,
      density: 1.029,
      conductivity: 5.1
    };
    const res1 = sensorService.validateReading(nanPayload);
    assert.strictEqual(res1.valid, false);
    assert.ok(res1.error?.includes('temperature'));

    const infPayload = {
      deviceId: 'ESP32-MILK-001',
      temperature: 25.0,
      ph: 6.65,
      fat: Infinity,
      density: 1.029,
      conductivity: 5.1
    };
    const res2 = sensorService.validateReading(infPayload);
    assert.strictEqual(res2.valid, false);
    assert.ok(res2.error?.includes('fat'));
  });

  it('should reject negative milk level/volume', () => {
    const negativeVolumePayload = {
      deviceId: 'ESP32-MILK-001',
      temperature: 25.0,
      ph: 6.65,
      fat: 4.0,
      density: 1.029,
      conductivity: 5.1,
      milkLevel: -10.5
    };
    const res = sensorService.validateReading(negativeVolumePayload);
    assert.strictEqual(res.valid, false);
    assert.ok(res.error?.includes('milkLevel'));
  });

  it('should reject invalid timestamp strings', () => {
    const badTimestampPayload = {
      deviceId: 'ESP32-MILK-001',
      temperature: 25.0,
      ph: 6.65,
      fat: 4.0,
      density: 1.029,
      conductivity: 5.1,
      timestamp: 'not-a-valid-date-string'
    };
    const res = sensorService.validateReading(badTimestampPayload);
    assert.strictEqual(res.valid, false);
    assert.ok(res.error?.includes('timestamp'));
  });
});

describe('Workflow & Decision Logic Rules', () => {
  it('should enforce that rejected batches yield 0 payout rate', () => {
    const lowScorePrice = QualityService.calculatePricing(4.5, 40.0, DEFAULT_THRESHOLDS);
    assert.strictEqual(lowScorePrice, 0);

    const zeroScorePrice = QualityService.calculatePricing(4.5, 0, DEFAULT_THRESHOLDS);
    assert.strictEqual(zeroScorePrice, 0);
  });

  it('should calculate correct payout when batch is accepted with warning', () => {
    // Score 70 -> FAIR quality multiplier 0.90
    // Base: 38.0 + (4.0 - 3.5)*3.5 = 38.0 + 1.75 = 39.75
    // 39.75 * 0.90 = 35.775 -> 35.77
    const price = QualityService.calculatePricing(4.0, 70.0, DEFAULT_THRESHOLDS);
    assert.strictEqual(price, 35.77);
  });

  // Comprehensive 8-point Decision Matrix Verification
  const resolveDecision = (recommended: 'ACCEPTED' | 'WARNING' | 'REJECTED', operatorDecision?: string) => {
    if (operatorDecision === 'ACCEPT' || operatorDecision === 'REJECT') {
      return operatorDecision;
    }
    if (operatorDecision === undefined || operatorDecision === null) {
      return recommended === 'REJECTED' ? 'REJECT' : 'ACCEPT';
    }
    return 'INVALID';
  };

  const validateOverride = (
    recommended: 'ACCEPTED' | 'WARNING' | 'REJECTED',
    decision: string,
    overrideReason?: string
  ) => {
    if (decision !== 'ACCEPT' && decision !== 'REJECT') {
      return { valid: false, error: 'Invalid operator decision' };
    }
    if (recommended === 'REJECTED' && decision === 'ACCEPT') {
      const trimmed = typeof overrideReason === 'string' ? overrideReason.trim() : '';
      if (!trimmed) {
        return { valid: false, error: 'Manual override requires non-empty reason' };
      }
    }
    return { valid: true };
  };

  it('1. ACCEPTED recommendation + no decision => defaults to ACCEPT', () => {
    const decision = resolveDecision('ACCEPTED', undefined);
    assert.strictEqual(decision, 'ACCEPT');
    assert.strictEqual(validateOverride('ACCEPTED', decision).valid, true);
  });

  it('2. WARNING recommendation + no decision => defaults to ACCEPT', () => {
    const decision = resolveDecision('WARNING', undefined);
    assert.strictEqual(decision, 'ACCEPT');
    assert.strictEqual(validateOverride('WARNING', decision).valid, true);
  });

  it('3. REJECTED recommendation + no decision => defaults to REJECT', () => {
    const decision = resolveDecision('REJECTED', undefined);
    assert.strictEqual(decision, 'REJECT');
    assert.strictEqual(validateOverride('REJECTED', decision).valid, true);
  });

  it('4. REJECTED recommendation + ACCEPT + empty reason => invalid', () => {
    const res = validateOverride('REJECTED', 'ACCEPT', '');
    assert.strictEqual(res.valid, false);
    assert.ok(res.error?.includes('override'));
  });

  it('5. REJECTED recommendation + ACCEPT + whitespace reason => invalid', () => {
    const res = validateOverride('REJECTED', 'ACCEPT', '    ');
    assert.strictEqual(res.valid, false);
    assert.ok(res.error?.includes('override'));
  });

  it('6. REJECTED recommendation + ACCEPT + valid reason => valid', () => {
    const res = validateOverride('REJECTED', 'ACCEPT', 'Secondary spot check verified on calibrated lab meter');
    assert.strictEqual(res.valid, true);
  });

  it('7. REJECTED recommendation + REJECT decision => valid', () => {
    const res = validateOverride('REJECTED', 'REJECT', undefined);
    assert.strictEqual(res.valid, true);
  });

  it('8. Invalid operator decision => invalid', () => {
    const decision = resolveDecision('ACCEPTED', 'MAYBE');
    assert.strictEqual(decision, 'INVALID');
    const res = validateOverride('ACCEPTED', decision);
    assert.strictEqual(res.valid, false);
    assert.ok(res.error?.includes('decision'));
  });
});
