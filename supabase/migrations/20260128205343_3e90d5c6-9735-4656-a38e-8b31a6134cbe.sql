-- Add paid_amount column to store actual payment amount with discounts
ALTER TABLE user_subscriptions 
ADD COLUMN paid_amount integer DEFAULT NULL;

COMMENT ON COLUMN user_subscriptions.paid_amount IS 
  'Precio efectivamente pagado en centavos (incluye descuentos aplicados)';