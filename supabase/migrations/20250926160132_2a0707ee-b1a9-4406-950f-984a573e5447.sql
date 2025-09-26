-- Manual fix for Nicolas Kenny's subscription and access
-- First, update his subscription to premium
UPDATE public.user_subscriptions 
SET 
  plan = 'premium',
  status = 'active',
  polar_subscription_id = 'manual_fix_' || gen_random_uuid()::text,
  polar_customer_id = 'manual_customer_' || gen_random_uuid()::text,
  current_period_end = now() + interval '1 month',
  updated_at = now()
WHERE user_id = (
  SELECT id FROM public.profiles WHERE user_id = (
    SELECT id FROM auth.users WHERE email = 'nicolasdkenny.dev@gmail.com'
  )
);

-- Then, mark mentoria as completed in his profile
UPDATE public.profiles 
SET 
  mentoria_completed = true,
  updated_at = now()
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'nicolasdkenny.dev@gmail.com'
);