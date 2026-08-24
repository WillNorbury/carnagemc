REVOKE SELECT ON public.quiz_questions FROM anon, authenticated;

GRANT SELECT (id, quiz_id, prompt, points, sort_order, created_at) ON public.quiz_questions TO anon, authenticated;

GRANT INSERT, UPDATE, DELETE ON public.quiz_questions TO authenticated;
GRANT ALL ON public.quiz_questions TO service_role;