-- Convert nicolassespindola@gmail.com to premium user (permanent access)
UPDATE user_subscriptions 
SET 
  plan = 'premium',
  status = 'active',
  current_period_end = NULL,
  updated_at = now()
WHERE user_id = '87458f38-564c-4cb8-86c3-b073b67f013b';