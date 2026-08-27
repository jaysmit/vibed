import { connectDB } from '../connect';
import { Founder } from '../models';
import type { Types } from 'mongoose';

export interface LeanFounder {
  _id: Types.ObjectId;
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

/**
 * Get a founder by slug
 */
export async function getFounderBySlug(slug: string): Promise<LeanFounder | null> {
  await connectDB();
  return Founder.findOne({ slug }).lean<LeanFounder | null>();
}

/**
 * Get a founder by ID
 */
export async function getFounderById(id: string): Promise<LeanFounder | null> {
  await connectDB();
  return Founder.findById(id).lean<LeanFounder | null>();
}
