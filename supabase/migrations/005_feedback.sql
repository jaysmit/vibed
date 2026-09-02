-- Migration: Add feedback/support system
-- Run this in Supabase SQL Editor

-- ============================================
-- FEEDBACK TABLE
-- User bug reports, feature requests, and general feedback
-- ============================================

CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  founder_id UUID REFERENCES founders(id) ON DELETE SET NULL,

  -- Feedback details
  type TEXT NOT NULL CHECK (type IN ('bug', 'feature', 'general')),
  subject TEXT NOT NULL CHECK (char_length(subject) > 0 AND char_length(subject) <= 200),
  content TEXT NOT NULL CHECK (char_length(content) > 0 AND char_length(content) <= 5000),

  -- Screenshot (stored in Supabase Storage)
  screenshot_url TEXT,

  -- Auto-captured context
  page_url TEXT,
  browser_info JSONB,  -- { browser, version, os, device, screen }

  -- Status tracking for team
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewing', 'in_progress', 'resolved', 'closed')),
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  internal_notes TEXT,
  resolved_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_feedback_user ON feedback(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_type ON feedback(type);
CREATE INDEX IF NOT EXISTS idx_feedback_created ON feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_priority ON feedback(priority) WHERE priority IS NOT NULL;

COMMENT ON TABLE feedback IS 'User feedback, bug reports, and feature requests';
COMMENT ON COLUMN feedback.type IS 'Type of feedback: bug, feature, or general';
COMMENT ON COLUMN feedback.browser_info IS 'Auto-captured browser/device info as JSON';
COMMENT ON COLUMN feedback.status IS 'Workflow status: new, reviewing, in_progress, resolved, closed';

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Users can create feedback
CREATE POLICY "Authenticated users can create feedback" ON feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Users can view their own feedback
CREATE POLICY "Users can view their own feedback" ON feedback
  FOR SELECT USING (auth.uid() = user_id);

-- Note: Admin/team access requires service role key

-- ============================================
-- TRIGGER: Update updated_at timestamp
-- ============================================

CREATE OR REPLACE FUNCTION update_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER feedback_updated_at
  BEFORE UPDATE ON feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_feedback_updated_at();
