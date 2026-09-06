import { ISensorReading } from '../types';

class SensorService {
  private latestReadings: Map<string, ISensorReading> = new Map();

  constructor() {
    // Initialize default fallback baseline
    this.latestReadings.set('ESP32-MILK-001', {
      deviceId: 'ESP32-MILK-001',
      timestamp: new Date().toISOString(),
      temperature: 24.3,
      ph: 6.64,
      fat: 4.5,
      density: 1.029,
      conductivity: 5.1,
      milkLevel: 15.0
    });
  }

  public validateReading(data: any): { valid: boolean; error?: string; reading?: ISensorReading } {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return { valid: false, error: 'Payload must be a valid JSON object' };
    }

    const { deviceId, temperature, ph, fat, density, conductivity, milkLevel, timestamp } = data;

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
      return { valid: false, error: `Invalid temperature: must be a valid finite number` };
    }
    const tempNum = Number(temperature);
    if (tempNum < -10 || tempNum > 100) {
      return { valid: false, error: `Invalid temperature range (${tempNum} °C): must be between -10 and 100 °C` };
    }

    if (!isFiniteNumber(ph)) {
      return { valid: false, error: `Invalid pH: must be a valid finite number` };
    }
    const phNum = Number(ph);
    if (phNum < 0 || phNum > 14) {
      return { valid: false, error: `Invalid pH value (${phNum}): must be between 0 and 14` };
    }

    if (!isFiniteNumber(fat)) {
      return { valid: false, error: `Invalid fat percentage: must be a valid finite number` };
    }
    const fatNum = Number(fat);
    if (fatNum < 0 || fatNum > 20) {
      return { valid: false, error: `Invalid fat percentage (${fatNum} %): must be between 0 and 20 %` };
    }

    if (!isFiniteNumber(density)) {
      return { valid: false, error: `Invalid density: must be a valid finite number` };
    }
    const densityNum = Number(density);
    if (densityNum < 0.5 || densityNum > 2.0) {
      return { valid: false, error: `Invalid density value (${densityNum} g/mL): must be between 0.5 and 2.0 g/mL` };
    }

    if (!isFiniteNumber(conductivity)) {
      return { valid: false, error: `Invalid conductivity: must be a valid finite number` };
    }
    const condNum = Number(conductivity);
    if (condNum < 0 || condNum > 50) {
      return { valid: false, error: `Invalid conductivity (${condNum} mS/cm): must be between 0 and 50 mS/cm` };
    }

    let levelNum = 0;
    if (milkLevel !== undefined && milkLevel !== null) {
      if (!isFiniteNumber(milkLevel)) {
        return { valid: false, error: `Invalid milkLevel: must be a finite number` };
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
        return { valid: false, error: `Invalid timestamp format` };
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
      milkLevel: Number(levelNum.toFixed(2))
    };

    return { valid: true, reading };
  }

  public storeReading(reading: ISensorReading): void {
    this.latestReadings.set(reading.deviceId, reading);
  }

  public getLatestReading(deviceId: string = 'ESP32-MILK-001'): ISensorReading {
    const existing = this.latestReadings.get(deviceId);
    if (existing) {
      return existing;
    }
    const fallback: ISensorReading = {
      deviceId,
      timestamp: new Date().toISOString(),
      temperature: 24.0,
      ph: 6.63,
      fat: 4.2,
      density: 1.029,
      conductivity: 5.0,
      milkLevel: 0
    };
    this.latestReadings.set(deviceId, fallback);
    return fallback;
  }

  public getAllLatestReadings(): ISensorReading[] {
    return Array.from(this.latestReadings.values());
  }

  /**
   * Generates a realistic micro-fluctuated reading around pure milk baselines for simulation
   */
  public generateSimulatedReading(deviceId: string = 'ESP32-MILK-001', baseLevel = 25.0): ISensorReading {
    const prev = this.getLatestReading(deviceId);
    
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
      milkLevel: baseLevel
    };

    this.latestReadings.set(deviceId, nextReading);
    return nextReading;
  }
}

export const sensorService = new SensorService();
