-- Fix: Agregar search_path a la función clean_old_rate_limits
CREATE OR REPLACE FUNCTION clean_old_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  DELETE FROM public.checkout_rate_limit
  WHERE last_request_at < now() - INTERVAL '1 hour';
END;
$$;