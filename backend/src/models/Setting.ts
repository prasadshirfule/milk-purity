import mongoose, { Document, Schema } from 'mongoose';
import { IDairySettings } from '../types';

export interface ISettingDocument extends IDairySettings, Document {}

const SettingSchema = new Schema<ISettingDocument>(
  {
    dairyName: { type: String, required: true },
    dairyAddress: { type: String, required: true },
    contactPhone: { type: String, required: true },
    contactEmail: { type: String, required: true },
    thresholds: {
      phMin: { type: Number, default: 6.5 },
      phMax: { type: Number, default: 6.8 },
      fatMin: { type: Number, default: 3.5 },
      fatMax: { type: Number, default: 6.5 },
      densityMin: { type: Number, default: 1.026 },
      densityMax: { type: Number, default: 1.034 },
      conductivityMin: { type: Number, default: 4.0 },
      conductivityMax: { type: Number, default: 6.0 },
      tempMin: { type: Number, default: 15.0 },
      tempMax: { type: Number, default: 30.0 },
      scoreExcellentMin: { type: Number, default: 90.0 },
      scoreGoodMin: { type: Number, default: 75.0 },
      scoreSuspiciousMin: { type: Number, default: 60.0 },
      baseRatePerLiter: { type: Number, default: 38.0 },
      fatPremiumFactor: { type: Number, default: 3.5 }
    }
  },
  { timestamps: true }
);

export const Setting = mongoose.model<ISettingDocument>('Setting', SettingSchema);
