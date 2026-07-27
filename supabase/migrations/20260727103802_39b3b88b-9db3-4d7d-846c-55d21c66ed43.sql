DROP POLICY "Users insert own application" ON public.applications;
CREATE POLICY "Users insert own application" ON public.applications
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND status = 'pending'::application_status
  AND reviewed_by IS NULL
  AND reviewed_at IS NULL
  AND reviewer_notes IS NULL
);