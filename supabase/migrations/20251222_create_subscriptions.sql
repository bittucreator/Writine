-- Create subscriptions table for tracking user plans
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  polar_customer_id TEXT,
  polar_order_id TEXT,
  polar_subscription_id TEXT,
  polar_product_id TEXT,
  status TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'canceled', 'past_due', 'inactive')),
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_polar_customer_id ON subscriptions(polar_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_polar_subscription_id ON subscriptions(polar_subscription_id);

-- Enable RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own subscription" ON subscriptions;
DROP POLICY IF EXISTS "Service role can manage subscriptions" ON subscriptions;

-- Users can view their own subscription
CREATE POLICY "Users can view own subscription" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Only service role (webhooks) can insert/update subscriptions
-- This is handled by using supabaseAdmin with service role key
