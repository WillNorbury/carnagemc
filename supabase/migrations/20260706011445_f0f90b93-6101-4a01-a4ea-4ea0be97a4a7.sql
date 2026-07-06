
-- Fix 1: prevent forged quiz results by removing the direct INSERT policy.
-- All inserts must now go through the SECURITY DEFINER RPC submit_quiz_attempt,
-- which recomputes score/percent/passed server-side.
DROP POLICY IF EXISTS "Users can insert their own quiz attempts" ON public.quiz_attempts;

-- Fix 2: hide the answer explanations from public readers. Anon/authenticated
-- can still read published quiz questions, but the 'explanation' column is
-- now readable only by admins/owners (and the SECURITY DEFINER RPCs).
REVOKE SELECT (explanation) ON public.quiz_questions FROM anon, authenticated;
