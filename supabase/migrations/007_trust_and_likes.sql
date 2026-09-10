-- 007_trust_and_likes.sql
-- Trust-based engagement system: likes (universal), endorsements (trust-gated), user trust tiers

-- ============================================
-- USER TRUST TABLE
-- Tracks user activity metrics and computed tier
-- ============================================

CREATE TABLE IF NOT EXISTS user_trust (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_active_at TIMESTAMPTZ DEFAULT NOW(),
  days_active INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  follows_count INTEGER DEFAULT 0,
  tier TEXT DEFAULT 'newcomer' CHECK (tier IN ('newcomer', 'member', 'contributor', 'champion')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Index for lookups by user
CREATE INDEX IF NOT EXISTS idx_user_trust_user_id ON user_trust(user_id);

-- ============================================
-- VENTURE LIKES TABLE
-- Simple likes - anyone can like a venture
-- ============================================

CREATE TABLE IF NOT EXISTS venture_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(venture_id, user_id)
);

-- Index for counting likes per venture
CREATE INDEX IF NOT EXISTS idx_venture_likes_venture_id ON venture_likes(venture_id);
-- Index for getting user's likes
CREATE INDEX IF NOT EXISTS idx_venture_likes_user_id ON venture_likes(user_id);

-- ============================================
-- VENTURE ENDORSEMENTS TABLE
-- Trust-gated endorsements with reason and weight
-- ============================================

CREATE TABLE IF NOT EXISTS venture_endorsements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id UUID NOT NULL REFERENCES ventures(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT CHECK (reason IN ('solid_idea', 'great_execution', 'inspiring_story', 'would_use_it')),
  endorser_tier TEXT NOT NULL CHECK (endorser_tier IN ('contributor', 'champion')),
  weight INTEGER DEFAULT 1 CHECK (weight IN (1, 2)),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(venture_id, user_id)
);

-- Index for counting endorsements per venture
CREATE INDEX IF NOT EXISTS idx_venture_endorsements_venture_id ON venture_endorsements(venture_id);
-- Index for getting user's endorsements
CREATE INDEX IF NOT EXISTS idx_venture_endorsements_user_id ON venture_endorsements(user_id);

-- ============================================
-- ADD COUNTERS TO VENTURES TABLE
-- Add likes and endorsements counters
-- ============================================

-- The counters JSONB column already exists, we'll update it in application code
-- No schema change needed - likes/endorsements will be stored in counters.likes, counters.endorsements

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE user_trust ENABLE ROW LEVEL SECURITY;
ALTER TABLE venture_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE venture_endorsements ENABLE ROW LEVEL SECURITY;

-- user_trust: users can read their own trust, service role can do everything
CREATE POLICY "Users can view their own trust" ON user_trust
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage user_trust" ON user_trust
  FOR ALL USING (auth.role() = 'service_role');

-- venture_likes: anyone can read, authenticated users can manage their own
CREATE POLICY "Anyone can view venture likes" ON venture_likes
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can like" ON venture_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike their own likes" ON venture_likes
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage venture_likes" ON venture_likes
  FOR ALL USING (auth.role() = 'service_role');

-- venture_endorsements: anyone can read, trust check handled in application
CREATE POLICY "Anyone can view venture endorsements" ON venture_endorsements
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can endorse" ON venture_endorsements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own endorsements" ON venture_endorsements
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage venture_endorsements" ON venture_endorsements
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- TRIGGER: Auto-update updated_at on user_trust
-- ============================================

CREATE OR REPLACE FUNCTION update_user_trust_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_trust_updated_at
  BEFORE UPDATE ON user_trust
  FOR EACH ROW
  EXECUTE FUNCTION update_user_trust_updated_at();
