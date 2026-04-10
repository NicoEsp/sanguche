
-- Add reserved spots columns to exclusive_sessions
ALTER TABLE public.exclusive_sessions
ADD COLUMN reserved_spots integer NOT NULL DEFAULT 0,
ADD COLUMN reserved_spots_notes text;

-- Update get_session_spots_left to account for reserved spots
CREATE OR REPLACE FUNCTION public.get_session_spots_left(p_session_id uuid)
 RETURNS integer
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT COALESCE(es.max_spots, 0) - COALESCE(es.reserved_spots, 0) - COUNT(sr.id)::integer
  FROM exclusive_sessions es
  LEFT JOIN session_reservations sr ON sr.session_id = es.id
  WHERE es.id = p_session_id AND es.is_active = true
  GROUP BY es.max_spots, es.reserved_spots;
$$;
