UPDATE public.user_subscriptions
SET 
  lemon_squeezy_customer_id = '7150814',
  lemon_squeezy_subscription_id = '1640512',
  lemon_squeezy_order_id = '6828911',
  updated_at = now()
WHERE user_id = (
  SELECT id FROM public.profiles WHERE email = 'juchambo@gmail.com' LIMIT 1
);