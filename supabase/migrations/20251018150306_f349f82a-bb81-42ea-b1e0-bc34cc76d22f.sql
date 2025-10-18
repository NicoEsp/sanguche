-- Remove Polar columns and add Lemon Squeezy columns to user_subscriptions
ALTER TABLE public.user_subscriptions 
  DROP COLUMN IF EXISTS polar_customer_id,
  DROP COLUMN IF EXISTS polar_subscription_id,
  ADD COLUMN IF NOT EXISTS lemon_squeezy_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS lemon_squeezy_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS lemon_squeezy_order_id TEXT;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_lemon_squeezy_subscription_id 
  ON public.user_subscriptions(lemon_squeezy_subscription_id);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_lemon_squeezy_customer_id 
  ON public.user_subscriptions(lemon_squeezy_customer_id);

-- Add comment for documentation
COMMENT ON COLUMN public.user_subscriptions.lemon_squeezy_subscription_id 
  IS 'Lemon Squeezy subscription ID from webhook events';

COMMENT ON COLUMN public.user_subscriptions.lemon_squeezy_customer_id 
  IS 'Lemon Squeezy customer ID from checkout/webhook';

COMMENT ON COLUMN public.user_subscriptions.lemon_squeezy_order_id 
  IS 'Lemon Squeezy order ID from initial purchase';