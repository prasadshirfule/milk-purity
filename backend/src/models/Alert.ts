import mongoose, { Document, Schema } from 'mongoose';
import { IAlert } from '../types';

export interface IAlertDocument extends IAlert, Document {}

const AlertSchema = new Schema<IAlertDocument>(
  {
    alertId: { type: String, required: true, unique: true, index: true },
    type: {
      type: String,
      enum: [
        'HIGH_CONDUCTIVITY',
        'ABNORMAL_PH',
        'LOW_FAT',
        'ABNORMAL_DENSITY',
        'SENSOR_ERROR',
        'DEVICE_OFFLINE',
        'SUSPICIOUS_MILK',
        'TEMPERATURE_DEVIATION',
        'SYSTEM_NOTICE'
      ],
      required: true
    },
    severity: { type: String, enum: ['INFO', 'WARNING', 'CRITICAL'], default: 'WARNING' },
    farmerId: { type: String },
    farmerName: { type: String },
    testId: { type: String },
    deviceId: { type: String },
    message: { type: String, required: true },
    status: { type: String, enum: ['ACTIVE', 'RESOLVED', 'DISMISSED'], default: 'ACTIVE' },
    timestamp: { type: Date, default: Date.now, index: true }
  },
  { timestamps: true }
);

export const Alert = mongoose.model<IAlertDocument>('Alert', AlertSchema);
