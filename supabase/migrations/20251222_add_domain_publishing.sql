-- Add domain_id and custom_slug to blogs table for publishing to custom domains
ALTER TABLE blogs ADD COLUMN IF NOT EXISTS domain_id UUID REFERENCES custom_domains(id) ON DELETE SET NULL;
ALTER TABLE blogs ADD COLUMN IF NOT EXISTS custom_slug TEXT;
ALTER TABLE blogs ADD COLUMN IF NOT EXISTS published_url TEXT;

-- Create index for faster domain lookups
CREATE INDEX IF NOT EXISTS idx_blogs_domain_id ON blogs(domain_id);

-- Create unique constraint for custom_slug per domain
CREATE UNIQUE INDEX IF NOT EXISTS idx_blogs_domain_slug ON blogs(domain_id, custom_slug) WHERE domain_id IS NOT NULL;

-- Add RLS policy for domain-based blog access
CREATE POLICY "Anyone can view published blogs on verified domains" ON blogs
  FOR SELECT USING (
    status = 'published' 
    AND domain_id IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM custom_domains cd 
      WHERE cd.id = blogs.domain_id 
      AND cd.status = 'verified'
    )
  );
