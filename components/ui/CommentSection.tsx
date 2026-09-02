'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Avatar } from './Avatar';
import type { CommentWithAuthor } from '@/lib/supabase/types';

interface CommentSectionProps {
  clipId: string;
  initialComments?: CommentWithAuthor[];
  initialTotal?: number;
}

export function CommentSection({
  clipId,
  initialComments = [],
  initialTotal = 0,
}: CommentSectionProps) {
  const [comments, setComments] = useState<CommentWithAuthor[]>(initialComments);
  const [total, setTotal] = useState(initialTotal);
  const [loading, setLoading] = useState(!initialComments.length);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(initialComments.length);

  // Input state
  const [content, setContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Expanded replies state
  const [expandedReplies, setExpandedReplies] = useState<Record<string, CommentWithAuthor[]>>({});
  const [loadingReplies, setLoadingReplies] = useState<Record<string, boolean>>({});

  // Fetch initial comments if not provided
  useEffect(() => {
    if (!initialComments.length) {
      fetchComments();
    }
  }, [clipId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchComments() {
    setLoading(true);
    try {
      const res = await fetch(`/api/clips/${clipId}/comments`);
      if (!res.ok) throw new Error('Failed to fetch comments');
      const data = await res.json();
      setComments(data.comments);
      setTotal(data.total);
      setHasMore(data.hasMore);
      setOffset(data.comments.length);
    } catch {
      setError('Failed to load comments');
    }
    setLoading(false);
  }

  async function loadMore() {
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/clips/${clipId}/comments?offset=${offset}`);
      if (!res.ok) throw new Error('Failed to fetch comments');
      const data = await res.json();
      setComments((prev) => [...prev, ...data.comments]);
      setHasMore(data.hasMore);
      setOffset((prev) => prev + data.comments.length);
    } catch {
      setError('Failed to load more comments');
    }
    setLoadingMore(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || submitting) return;

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`/api/clips/${clipId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim(),
          replyToId: replyingTo,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to post comment');
      }

      const data = await res.json();

      if (replyingTo) {
        // Add reply to expanded replies
        setExpandedReplies((prev) => ({
          ...prev,
          [replyingTo]: [...(prev[replyingTo] || []), data.comment],
        }));
        // Update reply count
        setComments((prev) =>
          prev.map((c) =>
            c.id === replyingTo
              ? { ...c, reply_count: (c.reply_count || 0) + 1 }
              : c
          )
        );
      } else {
        // Add to top of comments
        setComments((prev) => [data.comment, ...prev]);
        setTotal((prev) => prev + 1);
      }

      setContent('');
      setReplyingTo(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post comment');
    }
    setSubmitting(false);
  }

  async function handleDelete(commentId: string, isReply: boolean, parentId?: string) {
    if (!confirm('Delete this comment?')) return;

    try {
      const res = await fetch(`/api/comments/${commentId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete comment');

      if (isReply && parentId) {
        // Remove from expanded replies
        setExpandedReplies((prev) => ({
          ...prev,
          [parentId]: (prev[parentId] || []).filter((r) => r.id !== commentId),
        }));
        // Update reply count
        setComments((prev) =>
          prev.map((c) =>
            c.id === parentId
              ? { ...c, reply_count: Math.max(0, (c.reply_count || 0) - 1) }
              : c
          )
        );
      } else {
        // Remove from comments
        setComments((prev) => prev.filter((c) => c.id !== commentId));
        setTotal((prev) => Math.max(0, prev - 1));
      }
    } catch {
      setError('Failed to delete comment');
    }
  }

  async function loadReplies(commentId: string) {
    setLoadingReplies((prev) => ({ ...prev, [commentId]: true }));
    try {
      const res = await fetch(`/api/comments/${commentId}`);
      if (!res.ok) throw new Error('Failed to fetch replies');
      const data = await res.json();
      setExpandedReplies((prev) => ({ ...prev, [commentId]: data.replies }));
    } catch {
      setError('Failed to load replies');
    }
    setLoadingReplies((prev) => ({ ...prev, [commentId]: false }));
  }

  return (
    <div className="mt-6">
      <h3 className="text-[16px] font-bold mb-4 flex items-center gap-2">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        Comments {total > 0 && <span className="text-ink-3 font-normal">({total})</span>}
      </h3>

      {/* Comment input */}
      <form onSubmit={handleSubmit} className="mb-6">
        {replyingTo && (
          <div className="flex items-center gap-2 mb-2 text-[13px] text-ink-2">
            <span>Replying to comment</span>
            <button
              type="button"
              onClick={() => setReplyingTo(null)}
              className="text-dead hover:underline"
            >
              Cancel
            </button>
          </div>
        )}
        <div className="flex gap-3">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={replyingTo ? 'Write a reply...' : 'Add a comment...'}
            className="flex-1 px-4 py-3 rounded-xl border border-rule bg-page text-[14px] focus:outline-none focus:ring-2 focus:ring-go focus:border-transparent resize-none min-h-[80px]"
            maxLength={2000}
          />
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-[12px] text-ink-3">
            {content.length}/2000
          </span>
          <button
            type="submit"
            disabled={!content.trim() || submitting}
            className="px-4 py-2 bg-go text-[#00301E] font-semibold rounded-lg text-[13px] hover:bg-[#04B76B] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Posting...' : 'Post'}
          </button>
        </div>
        {error && (
          <p className="text-dead text-[13px] mt-2">{error}</p>
        )}
      </form>

      {/* Comments list */}
      {loading ? (
        <div className="text-center py-8">
          <div className="w-6 h-6 border-2 border-rule border-t-go rounded-full animate-spin mx-auto" />
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 text-ink-3 text-[14px]">
          No comments yet. Be the first to comment.
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onReply={() => setReplyingTo(comment.id)}
              onDelete={() => handleDelete(comment.id, false)}
              replies={expandedReplies[comment.id]}
              loadingReplies={loadingReplies[comment.id]}
              onLoadReplies={() => loadReplies(comment.id)}
              onDeleteReply={(replyId) => handleDelete(replyId, true, comment.id)}
            />
          ))}
        </div>
      )}

      {/* Load more */}
      {hasMore && (
        <div className="mt-4 text-center">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="text-[13px] font-medium text-go-deep hover:underline disabled:opacity-50"
          >
            {loadingMore ? 'Loading...' : 'Load more comments'}
          </button>
        </div>
      )}
    </div>
  );
}

interface CommentItemProps {
  comment: CommentWithAuthor;
  onReply: () => void;
  onDelete: () => void;
  replies?: CommentWithAuthor[];
  loadingReplies?: boolean;
  onLoadReplies: () => void;
  onDeleteReply: (replyId: string) => void;
}

function CommentItem({
  comment,
  onReply,
  onDelete,
  replies,
  loadingReplies,
  onLoadReplies,
  onDeleteReply,
}: CommentItemProps) {
  const hasReplies = (comment.reply_count || 0) > 0;
  const showReplies = replies && replies.length > 0;
  const canLoadReplies = hasReplies && !replies;

  return (
    <div className="bg-soft rounded-xl p-4">
      {/* Author */}
      <div className="flex items-start gap-3">
        {comment.author ? (
          <Link href={`/founder/${comment.author.slug}`}>
            <Avatar
              name={comment.author.name}
              imageUrl={comment.author.avatar_url}
              size="sm"
              color="#1F6F5C"
            />
          </Link>
        ) : (
          <Avatar name="User" size="sm" color="#8A8A8A" />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {comment.author ? (
              <Link
                href={`/founder/${comment.author.slug}`}
                className="text-[14px] font-semibold hover:underline"
              >
                {comment.author.name}
              </Link>
            ) : (
              <span className="text-[14px] font-semibold text-ink-2">Anonymous</span>
            )}
            <span className="text-[12px] text-ink-3">
              {formatTimeAgo(comment.created_at)}
            </span>
          </div>

          {/* Content */}
          <p className="text-[14px] text-ink mt-1 whitespace-pre-wrap break-words">
            {comment.content}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-4 mt-2">
            <button
              onClick={onReply}
              className="text-[12px] text-ink-3 hover:text-ink flex items-center gap-1"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
              Reply
            </button>
            <button
              onClick={onDelete}
              className="text-[12px] text-ink-3 hover:text-dead"
            >
              Delete
            </button>
          </div>

          {/* Load replies button */}
          {canLoadReplies && (
            <button
              onClick={onLoadReplies}
              disabled={loadingReplies}
              className="mt-3 text-[12px] font-medium text-go-deep hover:underline disabled:opacity-50"
            >
              {loadingReplies ? 'Loading...' : `View ${comment.reply_count} ${comment.reply_count === 1 ? 'reply' : 'replies'}`}
            </button>
          )}

          {/* Replies */}
          {showReplies && (
            <div className="mt-3 space-y-3 pl-4 border-l-2 border-rule">
              {replies.map((reply) => (
                <ReplyItem
                  key={reply.id}
                  reply={reply}
                  onDelete={() => onDeleteReply(reply.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface ReplyItemProps {
  reply: CommentWithAuthor;
  onDelete: () => void;
}

function ReplyItem({ reply, onDelete }: ReplyItemProps) {
  return (
    <div className="flex items-start gap-3">
      {reply.author ? (
        <Link href={`/founder/${reply.author.slug}`}>
          <Avatar
            name={reply.author.name}
            imageUrl={reply.author.avatar_url}
            size="sm"
            color="#1F6F5C"
          />
        </Link>
      ) : (
        <Avatar name="User" size="sm" color="#8A8A8A" />
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {reply.author ? (
            <Link
              href={`/founder/${reply.author.slug}`}
              className="text-[13px] font-semibold hover:underline"
            >
              {reply.author.name}
            </Link>
          ) : (
            <span className="text-[13px] font-semibold text-ink-2">Anonymous</span>
          )}
          <span className="text-[11px] text-ink-3">
            {formatTimeAgo(reply.created_at)}
          </span>
        </div>
        <p className="text-[13px] text-ink mt-0.5 whitespace-pre-wrap break-words">
          {reply.content}
        </p>
        <button
          onClick={onDelete}
          className="text-[11px] text-ink-3 hover:text-dead mt-1"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' });
}
