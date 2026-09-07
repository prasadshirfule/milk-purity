import mongoose, { Document, Schema } from 'mongoose';
import { IUser, UserRole, UserStatus } from '../types';

export interface IUserDocument extends Omit<IUser, 'createdAt' | 'updatedAt'>, Document {
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUserDocument>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    username: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: false },
    role: {
      type: String,
      enum: ['ADMIN', 'OPERATOR', 'QUALITY_OPERATOR', 'VIEWER'],
      default: 'OPERATOR',
      index: true
    },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE', index: true },
    dairyName: { type: String, default: 'Amrit Dairy Milk Collection Center' }
  },
  { timestamps: true }
);

export const User = mongoose.model<IUserDocument>('User', UserSchema);
