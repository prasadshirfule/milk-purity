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
    if (!data || typeof data !== 'object') {
      return { valid: false, error: 'Payload must be a valid JSON object' };
    }

    const { deviceId, temperature, ph, fat, density, conductivity, milkLevel, timestamp } = data;

    if (!deviceId || typeof deviceId !== 'string') {
      return { valid: false, error: 'Missing or invalid deviceId' };
    }

    const tempNum = Number(temperature);
    const phNum = Number(ph);
    const fatNum = Number(fat);
    const densityNum = Number(density);
    const condNum = Number(conductivity);
    const levelNum = Number(milkLevel ?? 0);

    if (isNaN(tempNum) || tempNum < -10 || tempNum > 100) {
      return { valid: false, error: `Invalid temperature: ${temperature} °C` };
    }
    if (isNaN(phNum) || phNum < 0 || phNum > 14) {
      return { valid: false, error: `Invalid pH value: ${ph}` };
    }
    if (isNaN(fatNum) || fatNum < 0 || fatNum > 20) {
      return { valid: false, error: `Invalid fat percentage: ${fat} %` };
    }
    if (isNaN(densityNum) || densityNum < 0.5 || densityNum > 2.0) {
      return { valid: false, error: `Invalid density value: ${density} g/mL` };
    }
    if (isNaN(condNum) || condNum < 0 || condNum > 50) {
      return { valid: false, error: `Invalid conductivity: ${conductivity} mS/cm` };
    }

    const reading: ISensorReading = {
      deviceId,
      timestamp: timestamp ? new Date(timestamp).toISOString() : new Date().toISOString(),
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
