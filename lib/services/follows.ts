import { connectDB } from '@/lib/db/connect';
import { Venture, EVENT_TYPES } from '@/lib/db/models';
import * as followsRepo from '@/lib/db/repos/follows';
import { logEvent } from './events';
import type { TargetType } from '@/lib/db/models/follow';

export interface FollowInput {
  userId: string;
  targetType: TargetType;
  targetId: string;
}

export async function followVenture(userId: string, ventureId: string): Promise<boolean> {
  await connectDB();

  // Check if already following
  const existing = await followsRepo.getFollow(userId, 'venture', ventureId);
  if (existing) {
    return false; // Already following
  }

  // Create follow
  await followsRepo.createFollow(userId, 'venture', ventureId);

  // Increment counter on venture (denormalised per architecture rules)
  await Venture.updateOne(
    { _id: ventureId },
    { $inc: { 'counters.followers': 1 } }
  );

  // Track event
  await logEvent({
    type: EVENT_TYPES.FOLLOW_CREATED,
    actorId: userId,
    ventureId: ventureId,
    meta: { targetType: 'venture' },
  });

  return true;
}

export async function unfollowVenture(userId: string, ventureId: string): Promise<boolean> {
  await connectDB();

  // Delete follow
  const deleted = await followsRepo.deleteFollow(userId, 'venture', ventureId);
  if (!deleted) {
    return false; // Wasn't following
  }

  // Decrement counter on venture
  await Venture.updateOne(
    { _id: ventureId },
    { $inc: { 'counters.followers': -1 } }
  );

  // Track event
  await logEvent({
    type: EVENT_TYPES.FOLLOW_REMOVED,
    actorId: userId,
    ventureId: ventureId,
    meta: { targetType: 'venture' },
  });

  return true;
}

export async function followFounder(userId: string, founderId: string): Promise<boolean> {
  await connectDB();

  const existing = await followsRepo.getFollow(userId, 'founder', founderId);
  if (existing) {
    return false;
  }

  await followsRepo.createFollow(userId, 'founder', founderId);

  await logEvent({
    type: EVENT_TYPES.FOLLOW_CREATED,
    actorId: userId,
    meta: { targetType: 'founder', founderId },
  });

  return true;
}

export async function unfollowFounder(userId: string, founderId: string): Promise<boolean> {
  await connectDB();

  const deleted = await followsRepo.deleteFollow(userId, 'founder', founderId);
  if (!deleted) {
    return false;
  }

  await logEvent({
    type: EVENT_TYPES.FOLLOW_REMOVED,
    actorId: userId,
    meta: { targetType: 'founder', founderId },
  });

  return true;
}

export async function getFollowedVentureIds(userId: string): Promise<string[]> {
  const follows = await followsRepo.getUserFollows(userId, 'venture');
  return follows.map((f) => f.targetId);
}

export async function isFollowingVenture(userId: string, ventureId: string): Promise<boolean> {
  return followsRepo.isFollowing(userId, 'venture', ventureId);
}
