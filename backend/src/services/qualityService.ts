import { ISensorReading, IQualityResult, IParameterAssessment, IThresholdSettings, ParameterStatus, QualityClassification, TestResult } from '../types';
import { DEFAULT_THRESHOLDS } from '../config/defaultThresholds';

/**
 * MILK PURITY & QUALITY EVALUATION SERVICE
 * 
 * NOTE: This is a software demonstration scoring engine based on standard dairy science
 * benchmark ranges (pH: 6.5-6.8, Density: 1.026-1.034 g/cm3, Fat: 3.5-6.5%, Conductivity: 4.0-6.0 mS/cm).
 * Certified adulteration assays require physical sensor calibration & verified ML models.
 */
export class QualityService {
  /**
   * Evaluate individual sensor parameters against threshold boundaries
   */
  private static assessParameter(
    val: number,
    min: number,
    max: number,
    unit: string,
    name: string
  ): IParameterAssessment {
    let status: ParameterStatus = 'NORMAL';
    let message = `${name} is optimal (${val} ${unit})`;

    if (val < min * 0.9 || val > max * 1.1) {
      status = 'CRITICAL';
      message = `${name} (${val} ${unit}) is dangerously outside acceptable bounds (${min} - ${max} ${unit})`;
    } else if (val < min) {
      status = 'LOW';
      message = `${name} (${val} ${unit}) is below normal baseline (${min} ${unit})`;
    } else if (val > max) {
      status = 'HIGH';
      message = `${name} (${val} ${unit}) exceeds normal baseline (${max} ${unit})`;
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
   * Calculates overall purity quality score (0-100), warnings, recommendations & classification
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

    // 1. pH evaluation (Crucial for freshness / curdling / neutralizers)
    if (phAssessment.status === 'CRITICAL') {
      penalty += 35;
      warnings.push(`Extreme pH reading (${reading.ph}). Indicates advanced microbial spoilage or chemical neutralization.`);
    } else if (phAssessment.status === 'LOW') {
      penalty += 15;
      warnings.push(`Low pH (${reading.ph}). Possible onset of souring or bacterial acid buildup.`);
    } else if (phAssessment.status === 'HIGH') {
      penalty += 15;
      warnings.push(`High pH (${reading.ph}). Potential mastitis or alkaline neutralizer added.`);
    }

    // 2. Density evaluation (Crucial indicator of water dilution or solids adulteration)
    if (densityAssessment.status === 'CRITICAL') {
      penalty += 40;
      warnings.push(`Severe density anomaly (${reading.density} g/mL). Strong indication of water adulteration.`);
    } else if (densityAssessment.status !== 'NORMAL') {
      penalty += 18;
      warnings.push(`Density deviation (${reading.density} g/mL). Normal range is ${thresholds.densityMin}-${thresholds.densityMax} g/mL.`);
    }

    // 3. Conductivity evaluation (Detects dissolved ionic salts, urea, detergents)
    if (condAssessment.status === 'CRITICAL') {
      penalty += 35;
      warnings.push(`High electrical conductivity (${reading.conductivity} mS/cm). Suspected ionic adulterants (salt/urea/mineral salts).`);
    } else if (condAssessment.status !== 'NORMAL') {
      penalty += 12;
      warnings.push(`Conductivity outside standard profile (${reading.conductivity} mS/cm).`);
    }

    // 4. Fat evaluation
    if (fatAssessment.status === 'CRITICAL') {
      penalty += 25;
      warnings.push(`Fat content (${reading.fat}%) drastically sub-standard.`);
    } else if (fatAssessment.status === 'LOW') {
      penalty += 10;
      warnings.push(`Fat percentage (${reading.fat}%) below target standard.`);
    }

    // 5. Temperature check
    if (tempAssessment.status !== 'NORMAL') {
      warnings.push(`Milk intake temperature is ${reading.temperature}°C. Rapid chilling advised.`);
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
      recommendations.push('Meets Grade-A quality standards. Approved for premium dairy processing.');
    } else if (score >= thresholds.scoreGoodMin) {
      classification = 'GOOD';
      result = 'ACCEPTED';
      recommendations.push('Standard commercial quality. Approved for normal processing.');
    } else if (score >= thresholds.scoreSuspiciousMin) {
      classification = 'SUSPICIOUS';
      result = 'WARNING';
      recommendations.push('Requires secondary laboratory verification before bulk tank blending.');
    } else {
      classification = 'REJECT';
      result = 'REJECTED';
      recommendations.push('Batch rejected. Fails dairy quality and safety thresholds.');
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
      mlConfidence: 0.95
    };
  }

  /**
   * Calculate purchase price per liter based on fat content and quality score
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
