import { ISensorReading } from '../types';
import { ENV } from '../config/environment';

export interface IMLResponse {
  prediction: string;
  confidence: number | null;
  score: number;
  purityScore: number;
  aiRecommendation: 'ACCEPT' | 'REVIEW' | 'REJECT';
  modelVersion: string;
  scoreExplanation: string[];
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
        const score = data.purity_score ?? data.score ?? 92.0;
        return {
          prediction: data.prediction || 'DEMO_NORMAL',
          confidence: data.confidence ?? null,
          score,
          purityScore: score,
          aiRecommendation: data.ai_recommendation || (score >= 75 ? 'ACCEPT' : score >= 60 ? 'REVIEW' : 'REJECT'),
          modelVersion: data.model_version || 'screening-baseline-v1',
          scoreExplanation: data.score_explanation || [],
          warnings: data.warnings || [],
          isMock: data.is_mock ?? true,
          disclaimer: 'Demo/engineering assessment only. Not a certified laboratory assay.'
        };
      }
    } catch (err) {
      // Python ML Service offline or unreachable -> use heuristic demonstration
    }

    // Baseline screening assessment fallback
    const isAnomaly = reading.ph < 6.4 || reading.ph > 6.9 || reading.conductivity > 6.2 || reading.density < 1.026;
    const score = isAnomaly ? 54.5 : 94.8;
    
    return {
      prediction: isAnomaly ? 'DEMO_ANOMALY' : 'DEMO_NORMAL',
      confidence: null, // neutral null for demo mode
      score,
      purityScore: score,
      aiRecommendation: isAnomaly ? 'REJECT' : 'ACCEPT',
      modelVersion: 'screening-baseline-v1',
      scoreExplanation: isAnomaly
        ? ['⚠ Parameter anomaly detected outside baseline bounds']
        : ['✓ Parameters within standard baseline bounds'],
      warnings: isAnomaly ? ['Parameter anomaly detected. Requires secondary laboratory verification.'] : [],
      isMock: true,
      disclaimer: 'Demo/engineering assessment only. Not a certified laboratory assay.'
    };
  }
}
