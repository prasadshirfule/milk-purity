import mongoose, { Document, Schema } from 'mongoose';
import { IMilkTest } from '../types';

export interface IMilkTestDocument extends IMilkTest, Document {}

const MilkTestSchema = new Schema<IMilkTestDocument>(
  {
    testId: { type: String, required: true, unique: true, index: true },
    farmerId: { type: String, required: true, index: true },
    farmerName: { type: String, default: '' },
    deviceId: { type: String, required: true, default: 'ESP32-MILK-001' },
    quantity: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now, index: true },
    temperature: { type: Number, required: true },
    ph: { type: Number, required: true },
    fat: { type: Number, required: true },
    density: { type: Number, required: true },
    conductivity: { type: Number, required: true },
    milkLevel: { type: Number, default: 0 },
    qualityScore: { type: Number, required: true },
    purityScore: { type: Number, default: function(this: any) { return this.qualityScore; } },
    classification: { type: String, enum: ['EXCELLENT', 'GOOD', 'SUSPICIOUS', 'REJECT', 'WARNING', 'POOR'], required: true },
    recommendedResult: { type: String, enum: ['ACCEPTED', 'REJECTED', 'WARNING'], default: 'ACCEPTED' },
    aiRecommendation: { type: String, enum: ['ACCEPT', 'REVIEW', 'REJECT'], default: 'ACCEPT' },
    operatorDecision: { type: String, enum: ['ACCEPT', 'REJECT'], default: 'ACCEPT' },
    overrideReason: { type: String, default: '' },
    modelVersion: { type: String, default: 'screening-baseline-v1' },
    scoreExplanation: [{ type: String }],
    prediction: { type: String, default: 'DEMO_NORMAL' },
    confidence: { type: Number, default: null },
    warnings: [{ type: String }],
    result: { type: String, enum: ['ACCEPTED', 'REJECTED', 'WARNING'], required: true },
    ratePerLiter: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    notes: { type: String, default: '' }
  },
  { timestamps: true }
);

export const MilkTest = mongoose.model<IMilkTestDocument>('MilkTest', MilkTestSchema);
