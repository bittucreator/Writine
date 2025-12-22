-- Ensure slugs are unique globally across all users
-- Add unique constraint to the slug column
ALTER TABLE blogs 
ADD CONSTRAINT blogs_slug_unique UNIQUE (slug);

-- Create index for faster slug lookups
CREATE INDEX IF NOT EXISTS idx_blogs_slug ON blogs(slug);
