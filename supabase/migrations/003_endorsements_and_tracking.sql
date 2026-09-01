-- Migration: Add clip endorsements, view tracking, and staff picks
-- Run this in Supabase SQL Editor

-- ============================================
-- CLIP ENDORSEMENTS
-- Individual endorsement records with optional reason tags
-- ============================================

CREATE TABLE IF NOT EXISTS clip_endorsements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clip_id UUID NOT NULL REFERENCES clips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT CHECK (reason IN ('honest_failure', 'useful_tactics', 'changed_thinking', 'less_alone')),
  founder_rung TEXT, -- snapshot of endorser's venture rung at time of endorsement (null if no venture)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(clip_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_clip_endorsements_clip ON clip_endorsements(clip_id);
CREATE INDEX IF NOT EXISTS idx_clip_endorsements_user ON clip_endorsements(user_id);
CREATE INDEX IF NOT EXISTS idx_clip_endorsements_reason ON clip_endorsements(reason) WHERE reason IS NOT NULL;

COMMENT ON TABLE clip_endorsements IS 'Individual endorsement records - users endorsing clips with optional reason';
COMMENT ON COLUMN clip_endorsements.reason IS 'Why the clip was helpful: honest_failure, useful_tactics, changed_thinking, less_alone';
COMMENT ON COLUMN clip_endorsements.founder_rung IS 'Snapshot of endorser venture rung at endorsement time - weights endorsements from active founders higher';

-- ============================================
-- CLIP VIEWS
-- Detailed view tracking for watch analytics
-- ============================================

CREATE TABLE IF NOT EXISTS clip_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clip_id UUID NOT NULL REFERENCES clips(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  anon_id TEXT, -- for non-logged-in users (ULID format)
  session_id TEXT, -- to detect rewatches within same session
  watch_percent INT DEFAULT 0 CHECK (watch_percent >= 0 AND watch_percent <= 100),
  completed BOOLEAN DEFAULT FALSE,
  rewatched BOOLEAN DEFAULT FALSE,
  followed_venture_after BOOLEAN DEFAULT FALSE,
  endorsed_after BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_clip_views_clip ON clip_views(clip_id);
CREATE INDEX IF NOT EXISTS idx_clip_views_user ON clip_views(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clip_views_anon ON clip_views(anon_id) WHERE anon_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clip_views_created ON clip_views(created_at);

COMMENT ON TABLE clip_views IS 'Detailed view tracking - watch progress, rewatches, follow-after behavior';
COMMENT ON COLUMN clip_views.watch_percent IS '0-100 representing how much of the clip was watched';
COMMENT ON COLUMN clip_views.rewatched IS 'True if same user/session watched this clip multiple times';
COMMENT ON COLUMN clip_views.followed_venture_after IS 'True if user followed the venture after watching';
COMMENT ON COLUMN clip_views.endorsed_after IS 'True if user endorsed the clip after watching';

-- ============================================
-- STAFF PICKS
-- Manual curation for featured content
-- ============================================

CREATE TABLE IF NOT EXISTS staff_picks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clip_id UUID NOT NULL REFERENCES clips(id) ON DELETE CASCADE,
  pillar TEXT NOT NULL CHECK (pillar IN ('the_idea', 'building_it', 'getting_customers', 'hard_parts', 'featured')),
  note TEXT, -- internal note about why this was picked
  active BOOLEAN DEFAULT TRUE,
  picked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(clip_id, pillar)
);

CREATE INDEX IF NOT EXISTS idx_staff_picks_pillar ON staff_picks(pillar) WHERE active = TRUE;
CREATE INDEX IF NOT EXISTS idx_staff_picks_clip ON staff_picks(clip_id);

COMMENT ON TABLE staff_picks IS 'Manually curated clips for landing page pillars';
COMMENT ON COLUMN staff_picks.pillar IS 'Which pillar: the_idea, building_it, getting_customers, hard_parts, or featured (top banner)';
COMMENT ON COLUMN staff_picks.note IS 'Internal note for why this clip was picked';

-- ============================================
-- EXTEND FOUNDERS TABLE
-- Add curator flag for future use
-- ============================================

ALTER TABLE founders ADD COLUMN IF NOT EXISTS is_curator BOOLEAN DEFAULT FALSE;
ALTER TABLE founders ADD COLUMN IF NOT EXISTS curator_since TIMESTAMPTZ;

COMMENT ON COLUMN founders.is_curator IS 'Whether this founder has curator privileges (future feature)';
COMMENT ON COLUMN founders.curator_since IS 'When curator status was granted';

-- ============================================
-- RLS POLICIES
-- ============================================

-- Clip endorsements: users can manage their own endorsements
ALTER TABLE clip_endorsements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all endorsements" ON clip_endorsements
  FOR SELECT USING (true);

CREATE POLICY "Users can create their own endorsements" ON clip_endorsements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own endorsements" ON clip_endorsements
  FOR DELETE USING (auth.uid() = user_id);

-- Clip views: anyone can insert, only service role can read all
ALTER TABLE clip_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can record views" ON clip_views
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their own views" ON clip_views
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Service role can update views" ON clip_views
  FOR UPDATE USING (true);

-- Staff picks: public read, admin write
ALTER TABLE staff_picks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active staff picks" ON staff_picks
  FOR SELECT USING (active = TRUE);

-- Note: Staff pick creation/deletion requires service role key (admin only)
