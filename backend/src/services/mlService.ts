import { ISensorReading, IThresholdSettings } from '../types';
import { ENV } from '../config/environment';
import { QualityService } from './qualityService';

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
   * Calls the FastAPI microservice or falls back to standard baseline calculation
   */
  public static async predictPurity(
    reading: ISensorReading,
    thresholds?: IThresholdSettings
  ): Promise<IMLResponse> {
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
        const rawScore = Number(data.purity_score ?? data.score);
        if (Number.isFinite(rawScore)) {
          const score = Number(Math.max(0, Math.min(100, rawScore)).toFixed(1));
          return {
            prediction: data.prediction || (score >= 75 ? 'DEMO_NORMAL' : 'DEMO_ANOMALY'),
            confidence: null, // neutral null per scientific honesty guidelines
            score,
            purityScore: score,
            aiRecommendation: (data.ai_recommendation as 'ACCEPT' | 'REVIEW' | 'REJECT') || (score >= 75 ? 'ACCEPT' : score >= 60 ? 'REVIEW' : 'REJECT'),
            modelVersion: data.model_version || 'screening-baseline-v1',
            scoreExplanation: Array.isArray(data.score_explanation) ? data.score_explanation : [],
            warnings: Array.isArray(data.warnings) ? data.warnings : [],
            isMock: true,
            disclaimer: 'Milk Purity Score is an automated quality-screening estimate based on measured parameters. It is not a substitute for laboratory adulteration testing.'
          };
        }
      }
    } catch (err) {
      // Python ML Service offline or unreachable -> use baseline screening calculation
    }

    // Baseline screening assessment fallback using QualityService directly
    const qualityEval = QualityService.calculateQuality(reading, thresholds);
    
    return {
      prediction: qualityEval.aiRecommendation === 'ACCEPT' ? 'DEMO_NORMAL' : 'DEMO_ANOMALY',
      confidence: null,
      score: qualityEval.purityScore,
      purityScore: qualityEval.purityScore,
      aiRecommendation: qualityEval.aiRecommendation,
      modelVersion: 'screening-baseline-v1',
      scoreExplanation: qualityEval.scoreExplanation,
      warnings: qualityEval.warnings,
      isMock: true,
      disclaimer: 'Milk Purity Score is an automated quality-screening estimate based on measured parameters. It is not a substitute for laboratory adulteration testing.'
    };
  }
}

