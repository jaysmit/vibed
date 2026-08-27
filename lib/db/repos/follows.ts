import { connectDB } from '../connect';
import { Follow, type TargetType } from '../models';
import { Types } from 'mongoose';

export interface FollowResult {
  userId: string;
  targetType: TargetType;
  targetId: string;
  createdAt: Date;
}

interface FollowDoc {
  userId: Types.ObjectId;
  targetType: TargetType;
  targetId: Types.ObjectId | string;
  createdAt: Date;
}

function toResult(doc: FollowDoc): FollowResult {
  return {
    userId: doc.userId.toString(),
    targetType: doc.targetType,
    targetId: typeof doc.targetId === 'string' ? doc.targetId : doc.targetId.toString(),
    createdAt: doc.createdAt,
  };
}

export async function getFollow(
  userId: string,
  targetType: TargetType,
  targetId: string
): Promise<FollowResult | null> {
  await connectDB();

  const doc = await Follow.findOne({
    userId: new Types.ObjectId(userId),
    targetType,
    targetId: targetType === 'question' ? targetId : new Types.ObjectId(targetId),
  }).lean<FollowDoc | null>();

  return doc ? toResult(doc) : null;
}

export async function getUserFollows(
  userId: string,
  targetType?: TargetType
): Promise<FollowResult[]> {
  await connectDB();

  const query: Record<string, unknown> = {
    userId: new Types.ObjectId(userId),
  };

  if (targetType) {
    query.targetType = targetType;
  }

  const docs = await Follow.find(query)
    .sort({ createdAt: -1 })
    .lean<FollowDoc[]>();

  return docs.map(toResult);
}

export async function createFollow(
  userId: string,
  targetType: TargetType,
  targetId: string
): Promise<FollowResult> {
  await connectDB();

  const doc = await Follow.create({
    userId: new Types.ObjectId(userId),
    targetType,
    targetId: targetType === 'question' ? targetId : new Types.ObjectId(targetId),
  });

  return toResult({
    userId: doc.userId,
    targetType: doc.targetType,
    targetId: doc.targetId,
    createdAt: doc.createdAt,
  });
}

export async function deleteFollow(
  userId: string,
  targetType: TargetType,
  targetId: string
): Promise<boolean> {
  await connectDB();

  const result = await Follow.deleteOne({
    userId: new Types.ObjectId(userId),
    targetType,
    targetId: targetType === 'question' ? targetId : new Types.ObjectId(targetId),
  });

  return result.deletedCount > 0;
}

export async function getFollowerCount(
  targetType: TargetType,
  targetId: string
): Promise<number> {
  await connectDB();

  return Follow.countDocuments({
    targetType,
    targetId: targetType === 'question' ? targetId : new Types.ObjectId(targetId),
  });
}

export async function isFollowing(
  userId: string,
  targetType: TargetType,
  targetId: string
): Promise<boolean> {
  const follow = await getFollow(userId, targetType, targetId);
  return follow !== null;
}
