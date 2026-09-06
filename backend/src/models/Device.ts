import mongoose, { Document, Schema } from 'mongoose';
import { IDevice } from '../types';

export interface IDeviceDocument extends IDevice, Document {}

const DeviceSchema = new Schema<IDeviceDocument>(
  {
    deviceId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    status: { type: String, enum: ['CONNECTED', 'DISCONNECTED', 'ERROR', 'OFFLINE'], default: 'CONNECTED' },
    firmwareVersion: { type: String, default: 'v1.2.0' },
    ipAddress: { type: String, default: '192.168.1.105' },
    macAddress: { type: String, default: '3C:71:BF:4E:91:2A' },
    lastSeen: { type: Date, default: Date.now },
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
