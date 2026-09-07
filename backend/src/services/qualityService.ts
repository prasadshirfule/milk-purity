import { ISensorReading, IQualityResult, IParameterAssessment, IThresholdSettings, ParameterStatus, QualityClassification, TestResult } from '../types';
import { DEFAULT_THRESHOLDS } from '../config/defaultThresholds';

/**
 * MILKGUARD QUALITY EVALUATION SERVICE
 * 
 * NOTE: Demo/engineering assessment only. Not a certified laboratory assay.
 * Evaluates multi-sensor telemetry against user-configured reference ranges.
 */
export class QualityService {
  /**
   * Evaluate individual sensor parameters against configured reference ranges
   */
  public static assessParameter(
    val: number,
    min: number,
    max: number,
    unit: string,
    name: string
  ): IParameterAssessment {
    let status: ParameterStatus = 'NORMAL';
    let message = `${name} within configured reference range (${val} ${unit})`;

    const range = max - min;
    const criticalMargin = range > 0 ? range * 0.5 : Math.max(0.1, min * 0.1);
    const criticalLower = min - criticalMargin;
    const criticalUpper = max + criticalMargin;

    if (val < criticalLower || val > criticalUpper) {
      status = 'CRITICAL';
      message = `${name} (${val} ${unit}) significantly outside reference bounds (${min} – ${max} ${unit}). Requires laboratory verification.`;
    } else if (val < min) {
      status = 'LOW';
      message = `${name} (${val} ${unit}) is below configured reference minimum (${min} ${unit})`;
    } else if (val > max) {
      status = 'HIGH';
      message = `${name} (${val} ${unit}) exceeds configured reference maximum (${max} ${unit})`;
    }

    return {
      status,
      reading: Number(val.toFixed(2)),
      normalMin: min,
      normalMax: max,
      unit,
      message
    };
  }

  /**
   * Calculates overall demonstration quality score (0-100), warnings, recommendations & classification
   */
  public static calculateQuality(
    reading: ISensorReading,
    thresholds: IThresholdSettings = DEFAULT_THRESHOLDS
  ): IQualityResult {
    const phAssessment = this.assessParameter(reading.ph, thresholds.phMin, thresholds.phMax, 'pH', 'pH');
    const fatAssessment = this.assessParameter(reading.fat, thresholds.fatMin, thresholds.fatMax, '%', 'Fat');
    const densityAssessment = this.assessParameter(reading.density, thresholds.densityMin, thresholds.densityMax, 'g/mL', 'Density');
    const condAssessment = this.assessParameter(reading.conductivity, thresholds.conductivityMin, thresholds.conductivityMax, 'mS/cm', 'Conductivity');
    const tempAssessment = this.assessParameter(reading.temperature, thresholds.tempMin, thresholds.tempMax, '°C', 'Temperature');

    const warnings: string[] = [];
    const recommendations: string[] = [];

    let penalty = 0;

    // 1. pH evaluation
    if (phAssessment.status === 'CRITICAL') {
      penalty += 35;
      warnings.push(`Extreme pH reading (${reading.ph}). Parameter anomaly detected. Requires laboratory verification.`);
    } else if (phAssessment.status === 'LOW') {
      penalty += 15;
      warnings.push(`Low pH (${reading.ph}) below configured reference range (${thresholds.phMin}).`);
    } else if (phAssessment.status === 'HIGH') {
      penalty += 15;
      warnings.push(`High pH (${reading.ph}) above configured reference range (${thresholds.phMax}).`);
    }

    // 2. Density evaluation
    if (densityAssessment.status === 'CRITICAL') {
      penalty += 40;
      warnings.push(`Density anomaly detected (${reading.density} g/mL). Deviation from reference range (${thresholds.densityMin} – ${thresholds.densityMax} g/mL).`);
    } else if (densityAssessment.status !== 'NORMAL') {
      penalty += 18;
      warnings.push(`Density deviation (${reading.density} g/mL). Configured reference range is ${thresholds.densityMin} – ${thresholds.densityMax} g/mL.`);
    }

    // 3. Conductivity evaluation
    if (condAssessment.status === 'CRITICAL') {
      penalty += 35;
      warnings.push(`Conductivity outside configured reference range (${reading.conductivity} mS/cm). Secondary laboratory testing advised.`);
    } else if (condAssessment.status !== 'NORMAL') {
      penalty += 12;
      warnings.push(`Conductivity deviation (${reading.conductivity} mS/cm) from baseline profile.`);
    }

    // 4. Fat evaluation
    if (fatAssessment.status === 'CRITICAL') {
      penalty += 25;
      warnings.push(`Estimated fat content (${reading.fat}%) below configured reference minimum.`);
    } else if (fatAssessment.status === 'LOW') {
      penalty += 10;
      warnings.push(`Estimated fat content (${reading.fat}%) below configured reference range.`);
    }

    // 5. Temperature check
    if (tempAssessment.status !== 'NORMAL') {
      warnings.push(`Intake temperature (${reading.temperature} °C) outside optimal chilling range (${thresholds.tempMin} – ${thresholds.tempMax} °C).`);
    }

    // Calculate score
    const rawScore = Math.max(10, Math.min(100, 100 - penalty));
    const score = Number(rawScore.toFixed(1));

    // Classification
    let classification: QualityClassification = 'REJECT';
    let result: TestResult = 'REJECTED';

    if (score >= thresholds.scoreExcellentMin) {
      classification = 'EXCELLENT';
      result = 'ACCEPTED';
      recommendations.push('Parameters are within the configured reference ranges. Recommended for intake.');
    } else if (score >= thresholds.scoreGoodMin) {
      classification = 'GOOD';
      result = 'ACCEPTED';
      recommendations.push('Parameters within standard commercial reference tolerance. Recommended for processing.');
    } else if (score >= thresholds.scoreSuspiciousMin) {
      classification = 'SUSPICIOUS';
      result = 'WARNING';
      recommendations.push('Quality parameters borderline. Secondary laboratory verification advised before bulk blending.');
    } else {
      classification = 'REJECT';
      result = 'REJECTED';
      recommendations.push('Batch flagged for parameter deviation. Fails configured quality thresholds.');
    }

    return {
      score,
      classification,
      result,
      warnings,
      recommendations,
      parameters: {
        ph: phAssessment,
        fat: fatAssessment,
        density: densityAssessment,
        conductivity: condAssessment,
        temperature: tempAssessment
      },
      isMlPredicted: false,
      mlConfidence: undefined
    };
  }

  /**
   * Calculate demo procurement price per liter based on fat content and quality score
   * Note: This is an illustrative demo calculation in Indian Rupees (₹).
   */
  public static calculatePricing(
    fat: number,
    qualityScore: number,
    thresholds: IThresholdSettings = DEFAULT_THRESHOLDS
  ): number {
    const baseRate = thresholds.baseRatePerLiter;
    const fatBonus = Math.max(0, (fat - thresholds.fatMin) * thresholds.fatPremiumFactor);
    const qualityMultiplier = qualityScore >= 90 ? 1.05 : qualityScore >= 75 ? 1.0 : qualityScore >= 60 ? 0.9 : 0;
    
    return Number(( (baseRate + fatBonus) * qualityMultiplier ).toFixed(2));
  }
}
