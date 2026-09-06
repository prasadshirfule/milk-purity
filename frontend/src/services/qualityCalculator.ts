import { SensorReading, QualityResult, ParameterAssessment, ThresholdSettings, ParameterStatus, QualityClassification, TestResult } from '../types';

export class QualityCalculator {
  private static assess(val: number, min: number, max: number, unit: string, name: string): ParameterAssessment {
    let status: ParameterStatus = 'NORMAL';
    let message = `${name} is optimal (${val} ${unit})`;

    if (val < min * 0.9 || val > max * 1.1) {
      status = 'CRITICAL';
      message = `${name} (${val} ${unit}) is dangerously outside standard (${min} - ${max} ${unit})`;
    } else if (val < min) {
      status = 'LOW';
      message = `${name} (${val} ${unit}) is below normal minimum (${min} ${unit})`;
    } else if (val > max) {
      status = 'HIGH';
      message = `${name} (${val} ${unit}) exceeds normal maximum (${max} ${unit})`;
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
      warnings.push(`Abnormal pH (${reading.ph}). Microbial acidification or chemical neutralizer detected.`);
    } else if (ph.status !== 'NORMAL') {
      penalty += 15;
      warnings.push(`pH deviation (${reading.ph}). Standard is ${thresholds.phMin}-${thresholds.phMax}.`);
    }

    if (density.status === 'CRITICAL') {
      penalty += 40;
      warnings.push(`Severe density anomaly (${reading.density} g/mL). Water dilution suspected.`);
    } else if (density.status !== 'NORMAL') {
      penalty += 18;
      warnings.push(`Density deviation (${reading.density} g/mL). Standard is ${thresholds.densityMin}-${thresholds.densityMax} g/mL.`);
    }

    if (cond.status === 'CRITICAL') {
      penalty += 35;
      warnings.push(`High conductivity (${reading.conductivity} mS/cm). Added salts or neutralizers suspected.`);
    } else if (cond.status !== 'NORMAL') {
      penalty += 12;
      warnings.push(`Conductivity (${reading.conductivity} mS/cm) outside standard range.`);
    }

    if (fat.status === 'CRITICAL') {
      penalty += 25;
      warnings.push(`Fat (${reading.fat}%) significantly below standard threshold.`);
    } else if (fat.status === 'LOW') {
      penalty += 10;
      warnings.push(`Fat (${reading.fat}%) below target standard.`);
    }

    const rawScore = Math.max(10, Math.min(100, 100 - penalty));
    const score = Number(rawScore.toFixed(1));

    let classification: QualityClassification = 'REJECT';
    let result: TestResult = 'REJECTED';

    if (score >= thresholds.scoreExcellentMin) {
      classification = 'EXCELLENT';
      result = 'ACCEPTED';
      recommendations.push('Grade-A Pure Milk. Approved for premium dairy intake.');
    } else if (score >= thresholds.scoreGoodMin) {
      classification = 'GOOD';
      result = 'ACCEPTED';
      recommendations.push('Standard commercial quality. Approved for normal processing.');
    } else if (score >= thresholds.scoreSuspiciousMin) {
      classification = 'SUSPICIOUS';
      result = 'WARNING';
      recommendations.push('Quality is borderline. Secondary laboratory confirmation advised.');
    } else {
      classification = 'REJECT';
      result = 'REJECTED';
      recommendations.push('Batch rejected. Failed minimum purity/hygiene safety thresholds.');
    }

    return {
      score,
      classification,
      result,
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
      mlConfidence: 0.95
    };
  }

  public static calculateRate(fat: number, qualityScore: number, thresholds: ThresholdSettings): number {
    const base = thresholds.baseRatePerLiter;
    const fatBonus = Math.max(0, (fat - thresholds.fatMin) * thresholds.fatPremiumFactor);
    const multiplier = qualityScore >= 90 ? 1.05 : qualityScore >= 75 ? 1.0 : qualityScore >= 60 ? 0.9 : 0;
    return Number(((base + fatBonus) * multiplier).toFixed(2));
  }
}
