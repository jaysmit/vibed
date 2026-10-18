-- Add tagline field to ventures
-- A short, punchy one-liner displayed on cover images (e.g., "Your idea, sold in sixty seconds")

ALTER TABLE ventures
ADD COLUMN IF NOT EXISTS tagline TEXT;

-- Add a comment for documentation
COMMENT ON COLUMN ventures.tagline IS 'Short tagline displayed on venture cards over cover image (max ~60 chars recommended)';
