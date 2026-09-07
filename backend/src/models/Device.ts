import mongoose, { Document, Schema } from 'mongoose';
import { IDevice } from '../types';

export interface IDeviceDocument extends IDevice, Document {}

const DeviceSchema = new Schema<IDeviceDocument>(
  {
    deviceId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    deviceType: {
      type: String,
      enum: ['ESP32_STATION', 'ESP32_PORTABLE', 'LAB_ANALYZER', 'SIMULATOR'],
      default: 'ESP32_STATION'
    },
    status: {
      type: String,
      enum: ['ONLINE', 'OFFLINE', 'WARNING', 'UNKNOWN', 'CONNECTED', 'DISCONNECTED', 'ERROR'],
      default: 'UNKNOWN'
    },
    connectionMode: {
      type: String,
      enum: ['DEMO', 'CONNECTED'],
      default: 'CONNECTED'
    },
    firmwareVersion: { type: String, default: 'v1.2.0' },
    apiKey: { type: String },
    ipAddress: { type: String, default: '192.168.1.105' },
    macAddress: { type: String, default: '3C:71:BF:4E:91:2A' },
    lastSeen: { type: Date },
    calibrationStatus: {
      type: String,
      enum: ['CALIBRATED', 'DUE', 'OVERDUE', 'UNKNOWN'],
      default: 'UNKNOWN'
    },
    lastCalibrationDate: { type: Date },
    calibrationDueDate: { type: Date },
    sensors: {
      temperature: { type: Boolean, default: true },
      ph: { type: Boolean, default: true },
      fat: { type: Boolean, default: true },
      conductivity: { type: Boolean, default: true },
      density: { type: Boolean, default: true },
      level: { type: Boolean, default: true }
    },
    location: { type: String, default: 'Testing Bay A' }
  },
  { timestamps: true }
);

export const Device = mongoose.model<IDeviceDocument>('Device', DeviceSchema);
