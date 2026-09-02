import { createAdminClient } from '@/lib/supabase/server';
import { logEvent } from './events';
import { EVENT_TYPES } from '@/lib/supabase/types';
import type { Comment, CommentWithAuthor } from '@/lib/supabase/types';

const MAX_COMMENT_LENGTH = 2000;

export interface CreateCommentInput {
  clipId: string;
  content: string;
  replyToId?: string;
}

/**
 * Create a new comment on a clip
 */
export async function createComment(
  userId: string,
  input: CreateCommentInput
): Promise<CommentWithAuthor> {
  const supabase = await createAdminClient();

  const { clipId, content, replyToId } = input;

  // Validate content
  if (!content.trim()) {
    throw new Error('Comment cannot be empty');
  }
  if (content.length > MAX_COMMENT_LENGTH) {
    throw new Error(`Comment cannot exceed ${MAX_COMMENT_LENGTH} characters`);
  }

  // Get the clip to verify it exists
  const { data: clip } = await supabase
    .from('clips')
    .select('id, venture_id')
    .eq('id', clipId)
    .is('deleted_at', null)
    .single();

  if (!clip) {
    throw new Error('Clip not found');
  }

  // Verify parent comment exists if replying
  if (replyToId) {
    const { data: parentComment } = await supabase
      .from('comments')
      .select('id')
      .eq('id', replyToId)
      .eq('clip_id', clipId)
      .is('deleted_at', null)
      .single();

    if (!parentComment) {
      throw new Error('Parent comment not found');
    }
  }

  // Get user's founder profile (if exists)
  const { data: founder } = await supabase
    .from('founders')
    .select('id, name, slug, links')
    .eq('user_id', userId)
    .single();

  // Insert comment
  const { data: comment, error } = await supabase
    .from('comments')
    .insert({
      clip_id: clipId,
      user_id: userId,
      founder_id: founder?.id || null,
      content: content.trim(),
      reply_to_id: replyToId || null,
    })
    .select()
    .single();

  if (error || !comment) {
    throw new Error(`Failed to create comment: ${error?.message}`);
  }

  // Increment comment counter on clip
  await incrementClipCommentCount(clipId);

  // Log event
  await logEvent({
    type: EVENT_TYPES.COMMENT_CREATED,
    actorId: userId,
    ventureId: clip.venture_id,
    clipId,
    meta: {
      commentId: comment.id,
      replyToId: replyToId || null,
      contentPreview: content.substring(0, 100),
    },
  });

  // Return comment with author info
  return {
    ...comment,
    author: founder
      ? {
          id: founder.id,
          name: founder.name,
          slug: founder.slug,
          avatar_url: (founder.links as Record<string, string>)?.avatar || null,
        }
      : null,
  } as CommentWithAuthor;
}

/**
 * Soft delete a comment
 */
export async function deleteComment(
  userId: string,
  commentId: string
): Promise<{ success: boolean }> {
  const supabase = await createAdminClient();

  // Get the comment to verify ownership
  const { data: comment } = await supabase
    .from('comments')
    .select('id, user_id, clip_id')
    .eq('id', commentId)
    .is('deleted_at', null)
    .single();

  if (!comment) {
    throw new Error('Comment not found');
  }

  if (comment.user_id !== userId) {
    throw new Error('Not authorized to delete this comment');
  }

  // Soft delete
  const { error } = await supabase
    .from('comments')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', commentId);

  if (error) {
    throw new Error(`Failed to delete comment: ${error.message}`);
  }

  // Decrement counter
  await decrementClipCommentCount(comment.clip_id);

  // Get clip for event logging
  const { data: clip } = await supabase
    .from('clips')
    .select('venture_id')
    .eq('id', comment.clip_id)
    .single();

  if (clip) {
    await logEvent({
      type: EVENT_TYPES.COMMENT_DELETED,
      actorId: userId,
      ventureId: clip.venture_id,
      clipId: comment.clip_id,
      meta: { commentId },
    });
  }

  return { success: true };
}

/**
 * Get comments for a clip with author info
 * Returns top-level comments with nested replies
 */
export async function getCommentsByClip(
  clipId: string,
  options: { limit?: number; offset?: number } = {}
): Promise<{ comments: CommentWithAuthor[]; total: number }> {
  const supabase = await createAdminClient();
  const { limit = 20, offset = 0 } = options;

  // Get total count for pagination
  const { count } = await supabase
    .from('comments')
    .select('id', { count: 'exact', head: true })
    .eq('clip_id', clipId)
    .is('deleted_at', null)
    .is('reply_to_id', null);

  // Get top-level comments with author info
  const { data: comments } = await supabase
    .from('comments')
    .select(`
      *,
      founders (
        id,
        name,
        slug,
        links
      )
    `)
    .eq('clip_id', clipId)
    .is('deleted_at', null)
    .is('reply_to_id', null)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (!comments) {
    return { comments: [], total: 0 };
  }

  // Get reply counts for each top-level comment
  const commentIds = comments.map((c) => c.id);
  const replyCounts: Record<string, number> = {};

  if (commentIds.length > 0) {
    const { data: repliesData } = await supabase
      .from('comments')
      .select('reply_to_id')
      .in('reply_to_id', commentIds)
      .is('deleted_at', null);

    if (repliesData) {
      for (const reply of repliesData) {
        if (reply.reply_to_id) {
          replyCounts[reply.reply_to_id] = (replyCounts[reply.reply_to_id] || 0) + 1;
        }
      }
    }
  }

  // Format comments with author info
  const formattedComments: CommentWithAuthor[] = comments.map((comment) => {
    const founder = comment.founders as {
      id: string;
      name: string;
      slug: string;
      links: Record<string, string>;
    } | null;

    return {
      id: comment.id,
      clip_id: comment.clip_id,
      user_id: comment.user_id,
      founder_id: comment.founder_id,
      content: comment.content,
      reply_to_id: comment.reply_to_id,
      deleted_at: comment.deleted_at,
      created_at: comment.created_at,
      updated_at: comment.updated_at,
      author: founder
        ? {
            id: founder.id,
            name: founder.name,
            slug: founder.slug,
            avatar_url: founder.links?.avatar || null,
          }
        : null,
      reply_count: replyCounts[comment.id] || 0,
    };
  });

  return { comments: formattedComments, total: count || 0 };
}

/**
 * Get replies to a comment
 */
export async function getReplies(commentId: string): Promise<CommentWithAuthor[]> {
  const supabase = await createAdminClient();

  const { data: replies } = await supabase
    .from('comments')
    .select(`
      *,
      founders (
        id,
        name,
        slug,
        links
      )
    `)
    .eq('reply_to_id', commentId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true });

  if (!replies) {
    return [];
  }

  return replies.map((reply) => {
    const founder = reply.founders as {
      id: string;
      name: string;
      slug: string;
      links: Record<string, string>;
    } | null;

    return {
      id: reply.id,
      clip_id: reply.clip_id,
      user_id: reply.user_id,
      founder_id: reply.founder_id,
      content: reply.content,
      reply_to_id: reply.reply_to_id,
      deleted_at: reply.deleted_at,
      created_at: reply.created_at,
      updated_at: reply.updated_at,
      author: founder
        ? {
            id: founder.id,
            name: founder.name,
            slug: founder.slug,
            avatar_url: founder.links?.avatar || null,
          }
        : null,
    };
  });
}

/**
 * Get comment count for a clip
 */
export async function getCommentCount(clipId: string): Promise<number> {
  const supabase = await createAdminClient();

  const { count } = await supabase
    .from('comments')
    .select('id', { count: 'exact', head: true })
    .eq('clip_id', clipId)
    .is('deleted_at', null);

  return count || 0;
}

// ============================================
// COUNTER HELPERS (denormalization)
// ============================================

async function incrementClipCommentCount(clipId: string) {
  const supabase = await createAdminClient();

  const { data: clip } = await supabase
    .from('clips')
    .select('counters')
    .eq('id', clipId)
    .single();

  if (!clip) return;

  const counters = clip.counters as Record<string, number>;
  await supabase
    .from('clips')
    .update({
      counters: {
        ...counters,
        comments: (counters.comments || 0) + 1,
      },
    })
    .eq('id', clipId);
}

async function decrementClipCommentCount(clipId: string) {
  const supabase = await createAdminClient();

  const { data: clip } = await supabase
    .from('clips')
    .select('counters')
    .eq('id', clipId)
    .single();

  if (!clip) return;

  const counters = clip.counters as Record<string, number>;
  await supabase
    .from('clips')
    .update({
      counters: {
        ...counters,
        comments: Math.max(0, (counters.comments || 0) - 1),
      },
    })
    .eq('id', clipId);
}
