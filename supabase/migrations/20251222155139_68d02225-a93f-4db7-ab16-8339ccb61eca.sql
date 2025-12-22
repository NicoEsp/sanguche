-- Create table for webhook logs
CREATE TABLE public.payment_webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name TEXT NOT NULL,
  event_data JSONB NOT NULL,
  user_email TEXT,
  user_id UUID REFERENCES public.profiles(id),
  lemon_squeezy_subscription_id TEXT,
  lemon_squeezy_customer_id TEXT,
  lemon_squeezy_order_id TEXT,
  status TEXT DEFAULT 'success',
  error_message TEXT,
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_webhook_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view webhook logs
CREATE POLICY "Only admins can view webhook logs" 
ON public.payment_webhook_logs 
FOR SELECT 
USING (is_admin());

-- Service role can insert webhook logs (used by edge functions)
CREATE POLICY "Service role can insert webhook logs" 
ON public.payment_webhook_logs 
FOR INSERT 
WITH CHECK (true);

-- Deny anonymous access
CREATE POLICY "payment_webhook_logs_deny_anonymous" 
ON public.payment_webhook_logs 
FOR ALL 
USING (false);

-- Create index for faster queries
CREATE INDEX idx_payment_webhook_logs_created_at ON public.payment_webhook_logs(created_at DESC);
CREATE INDEX idx_payment_webhook_logs_event_name ON public.payment_webhook_logs(event_name);
CREATE INDEX idx_payment_webhook_logs_user_email ON public.payment_webhook_logs(user_email);