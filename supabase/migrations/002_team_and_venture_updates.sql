-- Migration: Add team members and update ventures table
-- Run this in Supabase SQL Editor

-- Add country and categories columns to ventures table
ALTER TABLE ventures ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE ventures ADD COLUMN IF NOT EXISTS categories TEXT[] DEFAULT '{}';

-- Create venture_members table for team management
CREATE TABLE IF NOT EXISTS venture_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id UUID REFERENCES ventures(id) ON DELETE CASCADE NOT NULL,
  founder_id UUID REFERENCES founders(id) ON DELETE SET NULL,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  role TEXT CHECK (role IN ('founder', 'partner', 'team_member')) DEFAULT 'team_member',
  status TEXT CHECK (status IN ('pending', 'accepted', 'declined', 'removed')) DEFAULT 'pending',
  is_master BOOLEAN DEFAULT FALSE,
  invited_by UUID REFERENCES founders(id),
  invitation_token TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_venture_members_venture_id ON venture_members(venture_id);
CREATE INDEX IF NOT EXISTS idx_venture_members_founder_id ON venture_members(founder_id);
CREATE INDEX IF NOT EXISTS idx_venture_members_invitation_token ON venture_members(invitation_token);
CREATE INDEX IF NOT EXISTS idx_venture_members_email ON venture_members(email);

-- Add index on ventures for country filtering
CREATE INDEX IF NOT EXISTS idx_ventures_country ON ventures(country);

-- Create GIN index for categories array search
CREATE INDEX IF NOT EXISTS idx_ventures_categories ON ventures USING GIN(categories);

-- Comment for documentation
COMMENT ON TABLE venture_members IS 'Team members associated with ventures, including invitations';
COMMENT ON COLUMN venture_members.is_master IS 'True for the venture creator/owner';
COMMENT ON COLUMN venture_members.invitation_token IS 'Token for accepting invitation via link';
