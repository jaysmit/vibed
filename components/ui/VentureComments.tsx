'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Avatar } from './Avatar';

interface CommentAuthor {
  id: string;
  name: string;
  slug: string;
  avatar_url: string | null;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  author: CommentAuthor | null;
  reply_count?: number;
}

interface VentureCommentsProps {
  ventureId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function VentureComments({ ventureId, isOpen, onClose }: VentureCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Fetch comments when opened
  useEffect(() => {
    if (isOpen) {
      fetchComments();
    }
  }, [isOpen, ventureId]);

  const fetchComments = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/ventures/${ventureId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
        setTotal(data.total || 0);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch(`/api/ventures/${ventureId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        setComments([data.comment, ...comments]);
        setTotal((t) => t + 1);
        setNewComment('');
      } else {
        const data = await res.json();
        if (data.error === 'Authentication required') {
          window.location.href = `/login?redirect=/v/${ventureId}`;
        } else {
          setError(data.error || 'Failed to post comment');
        }
      }
    } catch (error) {
      setError('Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-page w-full max-w-[500px] max-h-[80vh] rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-rule">
          <h3 className="text-[16px] font-bold">
            Comments {total > 0 && <span className="text-ink-3 font-normal">({total})</span>}
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-ink-3 hover:text-ink transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Comments list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <div className="text-center py-8 text-ink-3">Loading comments...</div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-[32px] mb-2">💬</div>
              <p className="text-[14px] text-ink-3">No comments yet</p>
              <p className="text-[12px] text-ink-3 mt-1">Be the first to encourage them!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <Link href={comment.author ? `/founder/${comment.author.slug}` : '#'}>
                  <Avatar
                    name={comment.author?.name || 'Anonymous'}
                    imageUrl={comment.author?.avatar_url || undefined}
                    size="sm"
                  />
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {comment.author ? (
                      <Link
                        href={`/founder/${comment.author.slug}`}
                        className="font-semibold text-[13px] hover:underline"
                      >
                        {comment.author.name}
                      </Link>
                    ) : (
                      <span className="font-semibold text-[13px] text-ink-3">Anonymous</span>
                    )}
                    <span className="text-[11px] text-ink-3">{formatTime(comment.created_at)}</span>
                  </div>
                  <p className="text-[14px] text-ink-2 mt-0.5 whitespace-pre-wrap break-words">
                    {comment.content}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Comment input */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-rule bg-soft">
          {error && (
            <p className="text-[12px] text-dead mb-2">{error}</p>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              maxLength={2000}
              className="flex-1 px-4 py-2.5 rounded-full border border-rule bg-page text-[14px] placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-go focus:border-transparent"
            />
            <button
              type="submit"
              disabled={!newComment.trim() || isSubmitting}
              className="px-4 py-2.5 bg-go text-white font-semibold text-[13px] rounded-full hover:bg-go-deep disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? '...' : 'Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Simpler inline comment button that opens the modal
interface CommentButtonProps {
  ventureId: string;
  className?: string;
}

export function CommentButton({ ventureId, className = '' }: CommentButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [count, setCount] = useState(0);

  // Fetch comment count
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await fetch(`/api/ventures/${ventureId}/comments?limit=0`);
        if (res.ok) {
          const data = await res.json();
          setCount(data.total || 0);
        }
      } catch (error) {
        console.error('Error fetching comment count:', error);
      }
    };
    fetchCount();
  }, [ventureId]);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`text-[13px] font-semibold border border-go/40 text-go-deep py-2.5 px-4 rounded-lg hover:bg-go-tint transition-colors flex items-center gap-2 ${className}`}
      >
        💬 Comment
        {count > 0 && (
          <span className="bg-go-tint px-1.5 py-0.5 rounded text-[11px]">
            {count}
          </span>
        )}
      </button>

      <VentureComments
        ventureId={ventureId}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
