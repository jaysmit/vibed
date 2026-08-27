import mongoose, { Schema, Document, Types } from 'mongoose';

export type TargetType = 'venture' | 'founder' | 'question';

export interface IFollow extends Document {
  userId: Types.ObjectId;
  targetType: TargetType;
  targetId: Types.ObjectId | string; // ObjectId for venture/founder, string for question slug
  createdAt: Date;
}

const followSchema = new Schema<IFollow>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    targetType: {
      type: String,
      enum: ['venture', 'founder', 'question'],
      required: true,
    },
    targetId: {
      type: Schema.Types.Mixed,
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Indexes per architecture spec
followSchema.index({ userId: 1, targetId: 1 }, { unique: true });
followSchema.index({ targetId: 1, createdAt: -1 });

export const Follow = mongoose.models.Follow || mongoose.model<IFollow>('Follow', followSchema);
