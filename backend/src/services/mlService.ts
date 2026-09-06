import { ISensorReading } from '../types';
import { ENV } from '../config/environment';

export interface IMLResponse {
  prediction: string;
  confidence: number | null;
  score: number;
  warnings: string[];
  isMock: boolean;
  disclaimer: string;
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
          prediction: data.prediction || 'DEMO_NORMAL',
          confidence: data.confidence ?? null,
          score: data.score ?? 92.0,
          warnings: data.warnings || [],
          isMock: data.is_mock ?? true,
          disclaimer: 'Demo/engineering assessment only. Not a certified laboratory assay.'
        };
      }
    } catch (err) {
      // Python ML Service offline or unreachable -> use heuristic demonstration
    }

    // Heuristic demonstration prediction
    const isAnomaly = reading.ph < 6.4 || reading.ph > 6.9 || reading.conductivity > 6.2 || reading.density < 1.026;
    
    return {
      prediction: isAnomaly ? 'DEMO_ANOMALY' : 'DEMO_NORMAL',
      confidence: null, // neutral null for demo mode
      score: isAnomaly ? 54.5 : 94.8,
      warnings: isAnomaly ? ['Parameter anomaly detected. Requires secondary laboratory verification.'] : [],
      isMock: true,
      disclaimer: 'Demo/engineering assessment only. Not a certified laboratory assay.'
    };
  }
}
