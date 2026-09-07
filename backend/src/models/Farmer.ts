import mongoose, { Document, Schema } from 'mongoose';
import { IFarmer } from '../types';

export interface IFarmerDocument extends Omit<IFarmer, 'createdAt' | 'updatedAt'>, Document {
  createdAt: Date;
  updatedAt: Date;
}

const FarmerSchema = new Schema<IFarmerDocument>(
  {
    farmerId: { type: String, required: true, unique: true, index: true },
    customerCode: { type: String, required: true, unique: true, index: true, match: /^[A-Z][0-9]{4}$/ },
    name: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, trim: true },
    village: { type: String, required: true, trim: true },
    address: { type: String, default: '' },
    animalType: { type: String, enum: ['COW', 'BUFFALO', 'MIXED', 'GOAT'], default: 'COW' },
    notes: { type: String, default: '' },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
    totalMilkSupplied: { type: Number, default: 0 },
    totalCollections: { type: Number, default: 0 },
    averageQualityScore: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export const Farmer = mongoose.model<IFarmerDocument>('Farmer', FarmerSchema);
