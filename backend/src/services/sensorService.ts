import { ISensorReading, IThresholdSettings } from '../types';

class SensorService {
  private latestReadings: Map<string, ISensorReading> = new Map();

  constructor() {
    // Baseline sample initialized only for the demo device
    this.latestReadings.set('ESP32-DEMO-001', {
      deviceId: 'ESP32-DEMO-001',
      timestamp: new Date().toISOString(),
      temperature: 24.3,
      ph: 6.64,
      fat: 4.5,
      density: 1.029,
      conductivity: 5.1,
      milkLevel: 25.0,
      firmwareVersion: 'v2.0.0-demo',
      isDemo: true
    });
  }

  public validateReading(data: any): { valid: boolean; error?: string; reading?: ISensorReading } {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return { valid: false, error: 'Payload must be a valid JSON object' };
    }

    const {
      deviceId,
      temperature,
      ph,
      fat,
      density,
      conductivity,
      milkLevel,
      timestamp,
      firmwareVersion,
      sequenceNumber,
      batteryLevel,
      isDemo
    } = data;

    if (!deviceId || typeof deviceId !== 'string' || deviceId.trim() === '') {
      return { valid: false, error: 'Missing or invalid deviceId: must be a non-empty string' };
    }

    const isFiniteNumber = (val: any): boolean => {
      if (typeof val === 'number') {
        return Number.isFinite(val) && !isNaN(val);
      }
      if (typeof val === 'string') {
        const trimmed = val.trim();
        if (trimmed === '' || trimmed === 'Infinity' || trimmed === '-Infinity' || trimmed === 'NaN') return false;
        const num = Number(trimmed);
        return Number.isFinite(num) && !isNaN(num);
      }
      return false;
    };

    if (!isFiniteNumber(temperature)) {
      return { valid: false, error: 'Invalid temperature: must be a valid finite number' };
    }
    const tempNum = Number(temperature);
    if (tempNum < -10 || tempNum > 100) {
      return { valid: false, error: `Invalid temperature range (${tempNum} °C): must be between -10 and 100 °C` };
    }

    if (!isFiniteNumber(ph)) {
      return { valid: false, error: 'Invalid pH: must be a valid finite number' };
    }
    const phNum = Number(ph);
    if (phNum < 0 || phNum > 14) {
      return { valid: false, error: `Invalid pH value (${phNum}): must be between 0 and 14` };
    }

    if (!isFiniteNumber(fat)) {
      return { valid: false, error: 'Invalid fat percentage: must be a valid finite number' };
    }
    const fatNum = Number(fat);
    if (fatNum < 0 || fatNum > 20) {
      return { valid: false, error: `Invalid fat percentage (${fatNum} %): must be between 0 and 20 %` };
    }

    if (!isFiniteNumber(density)) {
      return { valid: false, error: 'Invalid density: must be a valid finite number' };
    }
    const densityNum = Number(density);
    if (densityNum < 0.5 || densityNum > 2.0) {
      return { valid: false, error: `Invalid density value (${densityNum} g/mL): must be between 0.5 and 2.0 g/mL` };
    }

    if (!isFiniteNumber(conductivity)) {
      return { valid: false, error: 'Invalid conductivity: must be a valid finite number' };
    }
    const condNum = Number(conductivity);
    if (condNum < 0 || condNum > 50) {
      return { valid: false, error: `Invalid conductivity (${condNum} mS/cm): must be between 0 and 50 mS/cm` };
    }

    let levelNum = 0;
    if (milkLevel !== undefined && milkLevel !== null) {
      if (!isFiniteNumber(milkLevel)) {
        return { valid: false, error: 'Invalid milkLevel: must be a finite number' };
      }
      levelNum = Number(milkLevel);
      if (levelNum < 0) {
        return { valid: false, error: `Invalid milkLevel (${levelNum} L): cannot be negative` };
      }
    }

    let parsedTimestamp = new Date().toISOString();
    if (timestamp !== undefined && timestamp !== null) {
      const parsed = new Date(timestamp);
      if (isNaN(parsed.getTime())) {
        return { valid: false, error: 'Invalid timestamp format' };
      }
      parsedTimestamp = parsed.toISOString();
    }

    const reading: ISensorReading = {
      deviceId: deviceId.trim(),
      timestamp: parsedTimestamp,
      temperature: Number(tempNum.toFixed(2)),
      ph: Number(phNum.toFixed(2)),
      fat: Number(fatNum.toFixed(2)),
      density: Number(densityNum.toFixed(4)),
      conductivity: Number(condNum.toFixed(2)),
      milkLevel: Number(levelNum.toFixed(2)),
      firmwareVersion: typeof firmwareVersion === 'string' ? firmwareVersion.trim() : undefined,
      sequenceNumber: isFiniteNumber(sequenceNumber) ? Number(sequenceNumber) : undefined,
      batteryLevel: isFiniteNumber(batteryLevel) ? Number(batteryLevel) : undefined,
      isDemo: Boolean(isDemo)
    };

    return { valid: true, reading };
  }

  public storeReading(reading: ISensorReading): {
    status: 'ACCEPTED' | 'DUPLICATE' | 'OUT_OF_ORDER';
    message: string;
    current: ISensorReading;
  } {
    const current = this.latestReadings.get(reading.deviceId);
    if (!current) {
      this.latestReadings.set(reading.deviceId, reading);
      return { status: 'ACCEPTED', message: 'Initial telemetry reading stored', current: reading };
    }

    // Check sequenceNumber when available on both packets
    if (reading.sequenceNumber !== undefined && current.sequenceNumber !== undefined) {
      if (reading.sequenceNumber > current.sequenceNumber) {
        this.latestReadings.set(reading.deviceId, reading);
        return { status: 'ACCEPTED', message: 'Telemetry updated with newer sequence packet', current: reading };
      } else if (reading.sequenceNumber === current.sequenceNumber) {
        return { status: 'DUPLICATE', message: 'Duplicate sequence number packet ignored', current };
      } else {
        return { status: 'OUT_OF_ORDER', message: 'Older sequence number packet rejected from overwriting newer reading', current };
      }
    }

    // Timestamp monotonicity check
    const newTime = new Date(reading.timestamp).getTime();
    const curTime = new Date(current.timestamp).getTime();

    if (!isNaN(newTime) && !isNaN(curTime)) {
      if (newTime > curTime) {
        this.latestReadings.set(reading.deviceId, reading);
        return { status: 'ACCEPTED', message: 'Telemetry updated with newer timestamp reading', current: reading };
      } else if (newTime === curTime) {
        return { status: 'DUPLICATE', message: 'Duplicate timestamp packet ignored', current };
      } else {
        return { status: 'OUT_OF_ORDER', message: 'Older timestamp packet rejected from overwriting newer reading', current };
      }
    }

    this.latestReadings.set(reading.deviceId, reading);
    return { status: 'ACCEPTED', message: 'Telemetry reading updated', current: reading };
  }

  public hasReading(deviceId: string): boolean {
    return this.latestReadings.has(deviceId);
  }

  public getLatestReading(deviceId: string): ISensorReading | null {
    return this.latestReadings.get(deviceId) || null;
  }

  public getAllLatestReadings(): ISensorReading[] {
    return Array.from(this.latestReadings.values());
  }

  /**
   * Generates a realistic micro-fluctuated reading around standard reference baselines for simulation
   */
  public generateSimulatedReading(deviceId: string = 'ESP32-DEMO-001', baseLevel = 25.0): ISensorReading {
    const prev = this.getLatestReading(deviceId) || {
      deviceId,
      timestamp: new Date().toISOString(),
      temperature: 24.2,
      ph: 6.64,
      fat: 4.5,
      density: 1.0295,
      conductivity: 4.9,
      milkLevel: baseLevel,
      isDemo: true
    };

    // Smooth Brownian jitter
    const tempJitter = (Math.random() - 0.5) * 0.15;
    const phJitter = (Math.random() - 0.5) * 0.02;
    const fatJitter = (Math.random() - 0.5) * 0.04;
    const densityJitter = (Math.random() - 0.5) * 0.0003;
    const condJitter = (Math.random() - 0.5) * 0.05;

    const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

    const nextReading: ISensorReading = {
      deviceId,
      timestamp: new Date().toISOString(),
      temperature: Number(clamp(prev.temperature + tempJitter, 22.0, 26.5).toFixed(2)),
      ph: Number(clamp(prev.ph + phJitter, 6.55, 6.75).toFixed(2)),
      fat: Number(clamp(prev.fat + fatJitter, 3.8, 5.2).toFixed(2)),
      density: Number(clamp(prev.density + densityJitter, 1.028, 1.032).toFixed(4)),
      conductivity: Number(clamp(prev.conductivity + condJitter, 4.6, 5.4).toFixed(2)),
      milkLevel: baseLevel,
      firmwareVersion: 'v2.0.0-demo',
      isDemo: true
    };

    this.latestReadings.set(deviceId, nextReading);
    return nextReading;
  }

  /**
   * Physical plausibility health assessment of an individual probe parameter
   */
  public assessParameterHealth(
    param: 'temperature' | 'ph' | 'fat' | 'density' | 'conductivity',
    value: number,
    thresholds: IThresholdSettings
  ): 'NORMAL' | 'WARNING' | 'INVALID' | 'NO_DATA' {
    if (value === undefined || value === null || !Number.isFinite(value)) {
      return 'NO_DATA';
    }

    switch (param) {
      case 'temperature':
        if (value < -10 || value > 100) return 'INVALID';
        if (value < thresholds.tempMin || value > thresholds.tempMax) return 'WARNING';
        return 'NORMAL';

      case 'ph':
        if (value < 0 || value > 14) return 'INVALID';
        if (value < thresholds.phMin || value > thresholds.phMax) return 'WARNING';
        return 'NORMAL';

      case 'fat':
        if (value < 0 || value > 20) return 'INVALID';
        if (value < thresholds.fatMin || value > thresholds.fatMax) return 'WARNING';
        return 'NORMAL';

      case 'density':
        if (value < 0.5 || value > 2.0) return 'INVALID';
        if (value < thresholds.densityMin || value > thresholds.densityMax) return 'WARNING';
        return 'NORMAL';

      case 'conductivity':
        if (value < 0 || value > 50) return 'INVALID';
        if (value < thresholds.conductivityMin || value > thresholds.conductivityMax) return 'WARNING';
        return 'NORMAL';

      default:
        return 'NORMAL';
    }
  }
}

export const sensorService = new SensorService();
