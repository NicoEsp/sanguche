CREATE OR REPLACE FUNCTION public.get_social_proof_metrics()
RETURNS TABLE(total_users bigint, total_assessments bigint)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    (SELECT COUNT(*) FROM profiles) as total_users,
    (SELECT COUNT(*) FROM assessments) as total_assessments;
$$;

-- Permitir que usuarios anónimos llamen a esta función
GRANT EXECUTE ON FUNCTION public.get_social_proof_metrics() TO anon;
GRANT EXECUTE ON FUNCTION public.get_social_proof_metrics() TO authenticated;