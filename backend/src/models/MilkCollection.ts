import mongoose, { Document, Schema } from 'mongoose';
import { IMilkCollection } from '../types';

export interface IMilkCollectionDocument extends IMilkCollection, Document {}

const MilkCollectionSchema = new Schema<IMilkCollectionDocument>(
  {
    collectionId: { type: String, required: true, unique: true, index: true },
    farmerId: { type: String, required: true, index: true },
    customerCode: { type: String, index: true },
    farmerName: { type: String, required: true },
    testId: { type: String, required: true, index: true },
    quantity: { type: Number, required: true },
    fat: { type: Number, required: true },
    rate: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    qualityScore: { type: Number, required: true },
    result: { type: String, enum: ['ACCEPTED', 'REJECTED', 'WARNING'], default: 'ACCEPTED' },
    operatorId: { type: String, default: 'USR-002' },
    operatorName: { type: String, default: 'Station Operator' },
    timestamp: { type: Date, default: Date.now, index: true },
    paymentStatus: { type: String, enum: ['PAID', 'PENDING'], default: 'PAID' }
  },
  { timestamps: true }
);

export const MilkCollection = mongoose.model<IMilkCollectionDocument>('MilkCollection', MilkCollectionSchema);
