-- Segment Nudges - allows users to request founders write specific journey chapters
-- When a non-owner visits a venture page and sees an empty segment, they can "nudge"
-- the founder to encourage them to write that chapter.

CREATE TABLE IF NOT EXISTS segment_nudges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  segment_key TEXT NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Each user can only nudge each segment once
  UNIQUE(venture_id, segment_key, user_id)
);

-- Index for counting nudges per segment
CREATE INDEX IF NOT EXISTS idx_segment_nudges_venture_segment
  ON segment_nudges(venture_id, segment_key);

-- Index for checking if a user has nudged
CREATE INDEX IF NOT EXISTS idx_segment_nudges_user
  ON segment_nudges(user_id, venture_id);

-- RLS policies
ALTER TABLE segment_nudges ENABLE ROW LEVEL SECURITY;

-- Anyone can read nudge counts (for displaying in UI)
CREATE POLICY "Anyone can read nudge counts"
  ON segment_nudges FOR SELECT
  USING (true);

-- Authenticated users can create nudges
CREATE POLICY "Authenticated users can create nudges"
  ON segment_nudges FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Users can delete their own nudges
CREATE POLICY "Users can delete own nudges"
  ON segment_nudges FOR DELETE
  USING (auth.uid() = user_id);
