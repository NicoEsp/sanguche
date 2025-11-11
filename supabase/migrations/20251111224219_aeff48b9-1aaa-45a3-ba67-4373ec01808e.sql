-- Migration para rate limiting en checkout
CREATE TABLE IF NOT EXISTS public.checkout_rate_limit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  first_request_at TIMESTAMPTZ DEFAULT now(),
  last_request_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_checkout_rate_limit_identifier ON public.checkout_rate_limit(identifier);
CREATE INDEX idx_checkout_rate_limit_last_request ON public.checkout_rate_limit(last_request_at);

-- Policy: Solo la edge function puede escribir (usando service role key)
ALTER TABLE public.checkout_rate_limit ENABLE ROW LEVEL SECURITY;

-- Función para limpiar entries antiguos (ejecutar periódicamente)
CREATE OR REPLACE FUNCTION clean_old_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.checkout_rate_limit
  WHERE last_request_at < now() - INTERVAL '1 hour';
END;
$$;