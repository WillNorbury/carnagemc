
DROP POLICY IF EXISTS "Anyone can subscribe" ON public.status_subscribers;
CREATE POLICY "Anyone can subscribe"
ON public.status_subscribers
FOR INSERT
TO anon, authenticated
WITH CHECK (
  email IS NOT NULL
  AND length(email) <= 254
  AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND (user_id IS NULL OR user_id = auth.uid())
);

DROP POLICY IF EXISTS "Service role can insert opt-outs" ON public.news_email_opt_outs;
