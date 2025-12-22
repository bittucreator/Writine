-- Add username column to user_profiles for subdomain routing
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS username VARCHAR(50) UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);

-- Update custom_domains to link with user's subdomain
ALTER TABLE custom_domains
ADD COLUMN IF NOT EXISTS subdomain VARCHAR(50);

-- Create index for domain lookups
CREATE INDEX IF NOT EXISTS idx_custom_domains_domain ON custom_domains(domain);
