import { SensorReading, QualityResult, ParameterAssessment, ThresholdSettings, ParameterStatus, QualityClassification, TestResult } from '../types';

export class QualityCalculator {
  private static assess(val: number, min: number, max: number, unit: string, name: string): ParameterAssessment {
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
      message = `${name} (${val} ${unit}) below reference minimum (${min} ${unit})`;
    } else if (val > max) {
      status = 'HIGH';
      message = `${name} (${val} ${unit}) exceeds reference maximum (${max} ${unit})`;
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

  public static calculate(reading: SensorReading, thresholds: ThresholdSettings): QualityResult {
    const ph = this.assess(reading.ph, thresholds.phMin, thresholds.phMax, 'pH', 'pH');
    const fat = this.assess(reading.fat, thresholds.fatMin, thresholds.fatMax, '%', 'Fat');
    const density = this.assess(reading.density, thresholds.densityMin, thresholds.densityMax, 'g/mL', 'Density');
    const cond = this.assess(reading.conductivity, thresholds.conductivityMin, thresholds.conductivityMax, 'mS/cm', 'Conductivity');
    const temp = this.assess(reading.temperature, thresholds.tempMin, thresholds.tempMax, '°C', 'Temperature');

    const warnings: string[] = [];
    const recommendations: string[] = [];
    let penalty = 0;

    if (ph.status === 'CRITICAL') {
      penalty += 35;
      warnings.push(`pH deviation (${reading.ph}). Parameter anomaly detected. Requires laboratory verification.`);
    } else if (ph.status !== 'NORMAL') {
      penalty += 15;
      warnings.push(`pH reading (${reading.ph}) outside reference range (${thresholds.phMin} – ${thresholds.phMax}).`);
    }

    if (density.status === 'CRITICAL') {
      penalty += 40;
      warnings.push(`Density anomaly detected (${reading.density} g/mL). Reference range is ${thresholds.densityMin} – ${thresholds.densityMax} g/mL.`);
    } else if (density.status !== 'NORMAL') {
      penalty += 18;
      warnings.push(`Density deviation (${reading.density} g/mL) from reference range.`);
    }

    if (cond.status === 'CRITICAL') {
      penalty += 35;
      warnings.push(`Conductivity (${reading.conductivity} mS/cm) elevated above reference baseline. Secondary laboratory verification advised.`);
    } else if (cond.status !== 'NORMAL') {
      penalty += 12;
      warnings.push(`Conductivity (${reading.conductivity} mS/cm) outside configured reference range.`);
    }

    if (fat.status === 'CRITICAL') {
      penalty += 25;
      warnings.push(`Estimated fat content (${reading.fat}%) below configured reference minimum.`);
    } else if (fat.status === 'LOW') {
      penalty += 10;
      warnings.push(`Estimated fat content (${reading.fat}%) below configured reference range.`);
    }

    // Score explanation observations
    const scoreExplanation: string[] = [];
    if (ph.status === 'NORMAL') {
      scoreExplanation.push(`✓ pH within configured reference range (${reading.ph})`);
    } else {
      scoreExplanation.push(`⚠ pH (${reading.ph}) outside reference range (${thresholds.phMin} – ${thresholds.phMax})`);
    }

    if (fat.status === 'NORMAL') {
      scoreExplanation.push(`✓ Estimated Fat within configured reference range (${reading.fat}%)`);
    } else {
      scoreExplanation.push(`⚠ Estimated Fat (${reading.fat}%) below configured minimum (${thresholds.fatMin}%)`);
    }

    if (density.status === 'NORMAL') {
      scoreExplanation.push(`✓ Density within configured reference range (${reading.density} g/mL)`);
    } else {
      scoreExplanation.push(`⚠ Density deviation (${reading.density} g/mL) outside reference range (${thresholds.densityMin} – ${thresholds.densityMax} g/mL)`);
    }

    if (cond.status === 'NORMAL') {
      scoreExplanation.push(`✓ Electrical Conductivity within reference baseline (${reading.conductivity} mS/cm)`);
    } else {
      scoreExplanation.push(`⚠ Electrical Conductivity (${reading.conductivity} mS/cm) elevated above baseline`);
    }

    if (temp.status === 'NORMAL') {
      scoreExplanation.push(`✓ Temperature within configured chilling range (${reading.temperature} °C)`);
    } else {
      scoreExplanation.push(`⚠ Intake temperature (${reading.temperature} °C) outside optimal chilling range (${thresholds.tempMin} – ${thresholds.tempMax} °C)`);
    }

    const rawScore = Math.max(0, Math.min(100, 100 - penalty));
    const score = Number(rawScore.toFixed(1));

    let classification: QualityClassification = 'REJECT';
    let result: TestResult = 'REJECTED';
    let aiRecommendation: 'ACCEPT' | 'REVIEW' | 'REJECT' = 'REJECT';

    if (score >= thresholds.scoreExcellentMin) {
      classification = 'EXCELLENT';
      result = 'ACCEPTED';
      aiRecommendation = 'ACCEPT';
      recommendations.push('Parameters within configured reference ranges. Recommended for intake.');
    } else if (score >= thresholds.scoreGoodMin) {
      classification = 'GOOD';
      result = 'ACCEPTED';
      aiRecommendation = 'ACCEPT';
      recommendations.push('Parameters within standard commercial reference tolerance. Recommended for processing.');
    } else if (score >= thresholds.scoreSuspiciousMin) {
      classification = 'SUSPICIOUS';
      result = 'WARNING';
      aiRecommendation = 'REVIEW';
      recommendations.push('Quality parameters borderline. Secondary laboratory verification advised before bulk blending.');
    } else {
      classification = 'REJECT';
      result = 'REJECTED';
      aiRecommendation = 'REJECT';
      recommendations.push('Batch flagged for parameter deviation. Fails configured quality thresholds.');
    }

    return {
      score,
      purityScore: score,
      classification,
      result,
      aiRecommendation,
      modelVersion: 'screening-baseline-v1',
      scoreExplanation,
      warnings,
      recommendations,
      parameters: {
        ph,
        fat,
        density,
        conductivity: cond,
        temperature: temp
      },
      isMlPredicted: false,
      mlConfidence: undefined
    };
  }

  public static calculateRate(fat: number, qualityScore: number, thresholds: ThresholdSettings): number {
    const base = thresholds.baseRatePerLiter;
    const fatBonus = Math.max(0, (fat - thresholds.fatMin) * thresholds.fatPremiumFactor);
    const multiplier = qualityScore >= 90 ? 1.05 : qualityScore >= 75 ? 1.0 : qualityScore >= 60 ? 0.9 : 0;
    return Number(((base + fatBonus) * multiplier).toFixed(2));
  }
}
