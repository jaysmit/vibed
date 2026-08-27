import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  name?: string;
  handle?: string;
  role: 'visitor' | 'user' | 'founder' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    name: {
      type: String,
      trim: true,
    },
    handle: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['visitor', 'user', 'founder', 'admin'],
      default: 'user',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
userSchema.index({ email: 1 });

export const User = mongoose.models.User || mongoose.model<IUser>('User', userSchema);
