-- Migration: Add comments system for clips
-- Run this in Supabase SQL Editor

-- ============================================
-- COMMENTS TABLE
-- Comments on clips with support for nested replies
-- ============================================

CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clip_id UUID NOT NULL REFERENCES clips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  founder_id UUID REFERENCES founders(id) ON DELETE SET NULL,
  content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 2000),
  reply_to_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_comments_clip ON comments(clip_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_founder ON comments(founder_id) WHERE founder_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_comments_reply_to ON comments(reply_to_id) WHERE reply_to_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_comments_created ON comments(created_at DESC);

COMMENT ON TABLE comments IS 'Comments on clips with support for nested replies';
COMMENT ON COLUMN comments.content IS 'Comment text, max 2000 characters';
COMMENT ON COLUMN comments.reply_to_id IS 'Parent comment ID for nested replies (NULL for top-level comments)';
COMMENT ON COLUMN comments.founder_id IS 'Reference to founders table for display purposes (may be NULL for non-founders)';

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Anyone can view non-deleted comments
CREATE POLICY "Anyone can view comments" ON comments
  FOR SELECT USING (deleted_at IS NULL);

-- Authenticated users can create comments
CREATE POLICY "Authenticated users can create comments" ON comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can soft-delete their own comments
CREATE POLICY "Users can delete their own comments" ON comments
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role can do anything (for admin operations)
-- Note: Service role bypasses RLS by default

-- ============================================
-- TRIGGER: Update updated_at timestamp
-- ============================================

CREATE OR REPLACE FUNCTION update_comment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_comment_updated_at();
