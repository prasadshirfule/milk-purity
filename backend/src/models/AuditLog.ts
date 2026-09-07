import mongoose, { Document, Schema } from 'mongoose';
import { IAuditLog } from '../types';

export interface IAuditLogDocument extends IAuditLog, Document {}

const AuditLogSchema = new Schema<IAuditLogDocument>(
  {
    auditId: { type: String, required: true, unique: true, index: true },
    timestamp: { type: Date, default: Date.now, index: true },
    userId: { type: String, required: true, index: true },
    userName: { type: String, required: true },
    role: { type: String, required: true, index: true },
    action: { type: String, required: true, index: true },
    entityType: { type: String, required: true, index: true },
    entityId: { type: String, default: '' },
    customerCode: { type: String, default: '', index: true },
    details: { type: String, required: true },
    ipAddress: { type: String, default: '' }
  },
  { timestamps: false }
);

export const AuditLog = mongoose.model<IAuditLogDocument>('AuditLog', AuditLogSchema);
