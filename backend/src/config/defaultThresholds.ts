import { IDairySettings, IThresholdSettings } from '../types';

export const DEFAULT_THRESHOLDS: IThresholdSettings = {
  phMin: 6.5,
  phMax: 6.8,
  fatMin: 3.5,
  fatMax: 6.5,
  densityMin: 1.026,
  densityMax: 1.034,
  conductivityMin: 4.0,
  conductivityMax: 6.0,
  tempMin: 15.0,
  tempMax: 30.0,
  scoreExcellentMin: 90.0,
  scoreGoodMin: 75.0,
  scoreSuspiciousMin: 60.0,
  baseRatePerLiter: 38.0, // Base rate in currency units (e.g. ₹ or $)
  fatPremiumFactor: 3.5    // Incentive per +0.1% fat
};

export const DEFAULT_SETTINGS: IDairySettings = {
  dairyName: 'Amrit Dairy Milk Collection Center',
  dairyAddress: 'Gate No. 4, Rural Development Complex, Pune Milk Zone',
  contactPhone: '+91 98765 43210',
  contactEmail: 'operations@amritdairy.com',
  thresholds: DEFAULT_THRESHOLDS
};
