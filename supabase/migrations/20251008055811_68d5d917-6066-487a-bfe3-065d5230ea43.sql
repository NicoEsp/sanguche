-- ============================================================================
-- CRITICAL SECURITY FIX: Block Anonymous Access to All Sensitive Tables
-- ============================================================================
-- This migration adds explicit RESTRICTIVE policies that deny ALL access 
-- to anonymous users across all tables containing sensitive user data.
-- RESTRICTIVE policies are evaluated with AND logic, so they block access
-- even if permissive policies would otherwise allow it.

-- 1. Profiles - Contains user names and mentoria completion status
CREATE POLICY "profiles_deny_anonymous"
ON public.profiles
AS RESTRICTIVE
FOR ALL
TO anon
USING (false);

COMMENT ON POLICY "profiles_deny_anonymous" ON public.profiles IS
'CRITICAL: Blocks anonymous users from enumerating user profiles and names.
Prevents user enumeration attacks and protects PII.';

-- 2. User Subscriptions - Contains payment/subscription information
CREATE POLICY "user_subscriptions_deny_anonymous"
ON public.user_subscriptions
AS RESTRICTIVE
FOR ALL
TO anon
USING (false);

COMMENT ON POLICY "user_subscriptions_deny_anonymous" ON public.user_subscriptions IS
'CRITICAL: Prevents anonymous users from viewing subscription status.
Protects payment information and prevents discovery of premium users.';

-- 3. Assessments - Contains user assessment results
CREATE POLICY "assessments_deny_anonymous_access"
ON public.assessments
AS RESTRICTIVE
FOR ALL
TO anon
USING (false);

COMMENT ON POLICY "assessments_deny_anonymous_access" ON public.assessments IS
'CRITICAL: Blocks anonymous access to user assessment data.
Already has auth check policy, but this adds defense-in-depth.';

-- 4. Admin Actions Log - Contains admin activity audit trail
CREATE POLICY "admin_actions_deny_anonymous"
ON public.admin_actions_log
AS RESTRICTIVE
FOR ALL
TO anon
USING (false);

COMMENT ON POLICY "admin_actions_deny_anonymous" ON public.admin_actions_log IS
'CRITICAL: Prevents anonymous discovery of admin users and actions.
Protects admin identity and prevents enumeration attacks.';

-- 5. User Roles - Contains role assignments (especially admin roles)
CREATE POLICY "user_roles_deny_anonymous"
ON public.user_roles
AS RESTRICTIVE
FOR ALL
TO anon
USING (false);

COMMENT ON POLICY "user_roles_deny_anonymous" ON public.user_roles IS
'CRITICAL: Prevents anonymous users from discovering admin/moderator assignments.
Essential for protecting privileged account information.';

-- 6. User Exercises - Contains assigned exercises and submissions
CREATE POLICY "user_exercises_deny_anonymous"
ON public.user_exercises
AS RESTRICTIVE
FOR ALL
TO anon
USING (false);

COMMENT ON POLICY "user_exercises_deny_anonymous" ON public.user_exercises IS
'CRITICAL: Blocks anonymous access to user exercise data and submissions.
Protects user work product and learning progress.';

-- 7. User Mentoria Opportunities - Contains personalized mentorship data
CREATE POLICY "user_mentoria_opportunities_deny_anonymous"
ON public.user_mentoria_opportunities
AS RESTRICTIVE
FOR ALL
TO anon
USING (false);

COMMENT ON POLICY "user_mentoria_opportunities_deny_anonymous" ON public.user_mentoria_opportunities IS
'CRITICAL: Prevents anonymous viewing of personalized mentorship opportunities.
Protects user skill levels and development areas.';

-- 8. User Mentoria Recommendations - Contains personalized skill recommendations
CREATE POLICY "user_mentoria_recommendations_deny_anonymous"
ON public.user_mentoria_recommendations
AS RESTRICTIVE
FOR ALL
TO anon
USING (false);

COMMENT ON POLICY "user_mentoria_recommendations_deny_anonymous" ON public.user_mentoria_recommendations IS
'CRITICAL: Blocks anonymous access to personalized skill recommendations.
Protects user development plans and skill gaps.';

-- 9. User Progress Objectives - Contains user goals and progress
CREATE POLICY "user_progress_objectives_deny_anonymous"
ON public.user_progress_objectives
AS RESTRICTIVE
FOR ALL
TO anon
USING (false);

COMMENT ON POLICY "user_progress_objectives_deny_anonymous" ON public.user_progress_objectives IS
'CRITICAL: Prevents anonymous viewing of user objectives and progress.
Protects user career development plans and mentor notes.';

-- 10. User Dedicated Resources - Contains user-specific resources
CREATE POLICY "user_dedicated_resources_deny_anonymous"
ON public.user_dedicated_resources
AS RESTRICTIVE
FOR ALL
TO anon
USING (false);

COMMENT ON POLICY "user_dedicated_resources_deny_anonymous" ON public.user_dedicated_resources IS
'CRITICAL: Blocks anonymous access to user-specific resources.
Protects personalized content and file URLs.';

-- 11. Security Audit - Contains security event logs
CREATE POLICY "security_audit_deny_anonymous"
ON public.security_audit
AS RESTRICTIVE
FOR ALL
TO anon
USING (false);

COMMENT ON POLICY "security_audit_deny_anonymous" ON public.security_audit IS
'CRITICAL: Prevents anonymous access to security audit logs.
Protects user activity monitoring and security event data.';

-- ============================================================================
-- Verification Query (Run after migration to confirm)
-- ============================================================================
-- Use this query to verify all tables have anonymous denial policies:
--
-- SELECT 
--   schemaname,
--   tablename,
--   policyname,
--   cmd,
--   roles
-- FROM pg_policies 
-- WHERE schemaname = 'public' 
--   AND 'anon' = ANY(roles)
--   AND policyname LIKE '%deny_anonymous%'
-- ORDER BY tablename;
-- ============================================================================