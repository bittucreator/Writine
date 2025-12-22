-- Create custom_domains table for user domain management
CREATE TABLE IF NOT EXISTS custom_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  domain TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_custom_domains_user_id ON custom_domains(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_domains_domain ON custom_domains(domain);
CREATE INDEX IF NOT EXISTS idx_custom_domains_status ON custom_domains(status);

-- Enable RLS
ALTER TABLE custom_domains ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own domains" ON custom_domains;
DROP POLICY IF EXISTS "Users can insert own domains" ON custom_domains;
DROP POLICY IF EXISTS "Users can update own domains" ON custom_domains;
DROP POLICY IF EXISTS "Users can delete own domains" ON custom_domains;
DROP POLICY IF EXISTS "Anyone can view verified domains" ON custom_domains;

-- Users can view their own domains
CREATE POLICY "Users can view own domains" ON custom_domains
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own domains
CREATE POLICY "Users can insert own domains" ON custom_domains
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own domains
CREATE POLICY "Users can update own domains" ON custom_domains
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own domains
CREATE POLICY "Users can delete own domains" ON custom_domains
  FOR DELETE USING (auth.uid() = user_id);

-- Public can look up verified domains (for middleware)
CREATE POLICY "Anyone can view verified domains" ON custom_domains
  FOR SELECT USING (status = 'verified');
