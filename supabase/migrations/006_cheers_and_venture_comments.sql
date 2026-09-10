-- Migration: Add cheers system and extend comments for ventures
-- Run this in Supabase SQL Editor

-- ============================================
-- CHEERS TABLE
-- Track cheers/encouragement on venture goals
-- ============================================

CREATE TABLE IF NOT EXISTS cheers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  founder_id UUID REFERENCES founders(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Each user can only cheer once per venture (for current goal)
  UNIQUE(venture_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cheers_venture ON cheers(venture_id);
CREATE INDEX IF NOT EXISTS idx_cheers_user ON cheers(user_id);
CREATE INDEX IF NOT EXISTS idx_cheers_created ON cheers(created_at DESC);

COMMENT ON TABLE cheers IS 'Tracks user cheers/encouragement on venture goals';

-- RLS
ALTER TABLE cheers ENABLE ROW LEVEL SECURITY;

-- Anyone can view cheers
CREATE POLICY "Anyone can view cheers" ON cheers
  FOR SELECT USING (true);

-- Authenticated users can create cheers
CREATE POLICY "Authenticated users can create cheers" ON cheers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can remove their own cheers
CREATE POLICY "Users can delete their own cheers" ON cheers
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- EXTEND COMMENTS FOR VENTURES
-- Add venture_id column, make clip_id optional
-- ============================================

-- Add venture_id column
ALTER TABLE comments ADD COLUMN IF NOT EXISTS venture_id UUID REFERENCES ventures(id) ON DELETE CASCADE;

-- Make clip_id nullable (was required before)
ALTER TABLE comments ALTER COLUMN clip_id DROP NOT NULL;

-- Add constraint: must have either clip_id OR venture_id
ALTER TABLE comments ADD CONSTRAINT comments_target_check
  CHECK (clip_id IS NOT NULL OR venture_id IS NOT NULL);

-- Index for venture comments
CREATE INDEX IF NOT EXISTS idx_comments_venture ON comments(venture_id) WHERE venture_id IS NOT NULL AND deleted_at IS NULL;

COMMENT ON COLUMN comments.venture_id IS 'Reference to venture for venture-level comments (NULL for clip comments)';

-- ============================================
-- ADD CHEERS COUNTER TO VENTURES
-- ============================================

-- Update ventures counters to include cheers if not present
-- This is handled in application code via JSONB merge
