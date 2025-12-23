-- Add payment failure tracking columns to subscriptions table
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS payment_failure_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS paused_at TIMESTAMP WITH TIME ZONE;

-- Add index for querying paused subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- Comment for clarity
COMMENT ON COLUMN subscriptions.payment_failure_count IS 'Number of consecutive payment failures';
COMMENT ON COLUMN subscriptions.paused_at IS 'Timestamp when account was paused due to payment failures';
