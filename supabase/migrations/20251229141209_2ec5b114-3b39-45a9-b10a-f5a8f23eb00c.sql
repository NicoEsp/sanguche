-- Add new plan values to subscription_plan enum
ALTER TYPE subscription_plan ADD VALUE IF NOT EXISTS 'repremium';
ALTER TYPE subscription_plan ADD VALUE IF NOT EXISTS 'curso_estrategia';
ALTER TYPE subscription_plan ADD VALUE IF NOT EXISTS 'cursos_all';

-- Add purchase_type column to distinguish subscriptions from one-time purchases
ALTER TABLE user_subscriptions 
ADD COLUMN IF NOT EXISTS purchase_type TEXT DEFAULT 'subscription'
CHECK (purchase_type IN ('subscription', 'one_time'));

-- Add lemon_squeezy_variant_id column to track which variant was purchased
ALTER TABLE user_subscriptions 
ADD COLUMN IF NOT EXISTS lemon_squeezy_variant_id TEXT;