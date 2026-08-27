import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IFounder extends Document {
  userId: Types.ObjectId;
  name: string;
  slug: string;
  bio?: string;
  location?: string;
  links: {
    x?: string;
    ig?: string;
    linkedin?: string;
    website?: string;
  };
  avatarKey?: string;
  createdAt: Date;
  updatedAt: Date;
}

const founderSchema = new Schema<IFounder>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    bio: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    links: {
      x: String,
      ig: String,
      linkedin: String,
      website: String,
    },
    avatarKey: String,
  },
  {
    timestamps: true,
  }
);

// Indexes
founderSchema.index({ slug: 1 }, { unique: true });
founderSchema.index({ userId: 1 });

export const Founder = mongoose.models.Founder || mongoose.model<IFounder>('Founder', founderSchema);
