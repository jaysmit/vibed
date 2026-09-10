-- Performance indexes for common query patterns
-- Run with: node scripts/migrate.js supabase/migrations/008_performance_indexes.sql

-- Ventures: Most queries filter by status and published_at
CREATE INDEX IF NOT EXISTS idx_ventures_status_published ON ventures(status, published_at DESC)
WHERE deleted_at IS NULL;

-- Ventures: Slug lookups (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_ventures_slug ON ventures(slug)
WHERE deleted_at IS NULL;

-- Ventures: Founder ID for "my ventures" queries
CREATE INDEX IF NOT EXISTS idx_ventures_founder_id ON ventures(founder_id)
WHERE deleted_at IS NULL;

-- Ventures: JSONB counters field (GIN index for all counter queries)
CREATE INDEX IF NOT EXISTS idx_ventures_counters ON ventures USING GIN (counters);

-- Ventures: For published ventures queries
CREATE INDEX IF NOT EXISTS idx_ventures_published ON ventures(published_at DESC)
WHERE status IN ('live', 'graduated', 'closed') AND deleted_at IS NULL AND published_at IS NOT NULL;

-- Clips: By venture (most common join)
CREATE INDEX IF NOT EXISTS idx_clips_venture_id ON clips(venture_id)
WHERE deleted_at IS NULL;

-- Clips: Published clips ordered by date
CREATE INDEX IF NOT EXISTS idx_clips_published ON clips(published_at DESC)
WHERE deleted_at IS NULL AND published_at IS NOT NULL;

-- Clips: Segment key for pitch clip lookups
CREATE INDEX IF NOT EXISTS idx_clips_venture_segment ON clips(venture_id, segment_key)
WHERE deleted_at IS NULL AND published_at IS NOT NULL;

-- Follows: User's followed ventures
CREATE INDEX IF NOT EXISTS idx_follows_user ON follows(user_id, venture_id);

-- Follows: Venture's followers count
CREATE INDEX IF NOT EXISTS idx_follows_venture ON follows(venture_id);

-- Founders: Slug lookups
CREATE INDEX IF NOT EXISTS idx_founders_slug ON founders(slug);

-- Founders: User ID for auth-to-founder mapping
CREATE INDEX IF NOT EXISTS idx_founders_user_id ON founders(user_id);

-- Venture members: By venture
CREATE INDEX IF NOT EXISTS idx_venture_members_venture ON venture_members(venture_id, status);

-- Likes: Dedupe check
CREATE INDEX IF NOT EXISTS idx_venture_likes_unique ON venture_likes(venture_id, user_id);

-- Endorsements: Dedupe check
CREATE INDEX IF NOT EXISTS idx_venture_endorsements_unique ON venture_endorsements(venture_id, user_id);

-- Trust: User lookup
CREATE INDEX IF NOT EXISTS idx_user_trust_user ON user_trust(user_id);

-- Comments: By clip ordered by date
CREATE INDEX IF NOT EXISTS idx_comments_clip ON comments(clip_id, created_at DESC)
WHERE deleted_at IS NULL;

-- Events: Analytics queries
CREATE INDEX IF NOT EXISTS idx_events_type_created ON events(type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_venture ON events(venture_id, created_at DESC);

-- Analyze tables to update statistics
ANALYZE ventures;
ANALYZE clips;
ANALYZE follows;
ANALYZE founders;
ANALYZE venture_members;
