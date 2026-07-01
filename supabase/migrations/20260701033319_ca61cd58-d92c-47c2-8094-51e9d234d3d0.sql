-- Lock down profiles.preferences: revoke direct column access from anon/authenticated
REVOKE SELECT (preferences) ON public.profiles FROM anon, authenticated;

-- Ensure service role retains full access
GRANT SELECT (preferences), UPDATE (preferences) ON public.profiles TO service_role;

-- Add service_role INSERT policy for news_email_opt_outs (for token-based one-click unsubscribes)
CREATE POLICY "Service role can insert opt-outs"
ON public.news_email_opt_outs
FOR INSERT
TO service_role
WITH CHECK (true);
