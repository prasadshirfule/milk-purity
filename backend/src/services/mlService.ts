import { ISensorReading } from '../types';
import { ENV } from '../config/environment';

export interface IMLResponse {
  prediction: string;
  confidence: number;
  score: number;
  warnings: string[];
  isMock: boolean;
}

export class MLService {
  /**
   * Calls the FastAPI microservice or falls back to standard heuristic calculation
   */
  public static async predictPurity(reading: ISensorReading): Promise<IMLResponse> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000); // Fast 2s timeout

      const response = await fetch(`${ENV.ML_SERVICE_URL}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reading),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (response.ok) {
        const data = await response.json();
        return {
          prediction: data.prediction || 'PURE',
          confidence: data.confidence ?? 0.95,
          score: data.score ?? 92.0,
          warnings: data.warnings || [],
          isMock: false
        };
      }
    } catch (err) {
      // Python ML Service offline or unreachable -> use heuristic demonstration
    }

    // Heuristic demonstration prediction
    const isAnomaly = reading.ph < 6.4 || reading.ph > 6.9 || reading.conductivity > 6.5 || reading.density < 1.025;
    
    return {
      prediction: isAnomaly ? 'ADULTERATION_SUSPECTED' : 'PURE',
      confidence: isAnomaly ? 0.89 : 0.96,
      score: isAnomaly ? 55.0 : 93.5,
      warnings: isAnomaly ? ['Parameter anomaly detected by demo heuristic model'] : [],
      isMock: true
    };
  }
}
