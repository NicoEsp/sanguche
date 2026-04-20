
-- Function to safely count remaining spots (bypasses RLS for counting)
CREATE OR REPLACE FUNCTION public.get_session_spots_left(p_session_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(es.max_spots, 0) - COUNT(sr.id)::integer
  FROM exclusive_sessions es
  LEFT JOIN session_reservations sr ON sr.session_id = es.id
  WHERE es.id = p_session_id AND es.is_active = true
  GROUP BY es.max_spots;
$$;

-- Update max_spots to 30
UPDATE exclusive_sessions SET max_spots = 30 WHERE slug = 'leading-lagging-indicators';
