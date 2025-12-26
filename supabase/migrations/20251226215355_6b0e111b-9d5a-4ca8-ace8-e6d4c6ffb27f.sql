-- Activar Premium para Leonardo (leomorsolin@gmail.com)
UPDATE public.user_subscriptions
SET 
  plan = 'premium',
  status = 'active',
  lemon_squeezy_subscription_id = '1748771',
  lemon_squeezy_customer_id = '7437263',
  lemon_squeezy_order_id = '7134666',
  updated_at = now()
WHERE user_id = 'cbef7657-a19a-4f10-a966-dff3eea223da';