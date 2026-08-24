-- Ensure explanation column is never readable by public roles
REVOKE SELECT ON public.quiz_questions FROM anon, authenticated;
GRANT SELECT (id, quiz_id, prompt, points, sort_order, created_at) ON public.quiz_questions TO anon, authenticated;

-- Remove public full-row read policy; public access goes through SECURITY DEFINER RPCs
DROP POLICY IF EXISTS "Anyone can read questions of published quizzes" ON public.quiz_questions;

-- Public-safe question counts
CREATE OR REPLACE FUNCTION public.get_quiz_question_counts(_quiz_ids uuid[])
RETURNS TABLE(quiz_id uuid, total bigint)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT qq.quiz_id, count(*)::bigint
  FROM public.quiz_questions qq
  JOIN public.quizzes q ON q.id = qq.quiz_id
  WHERE qq.quiz_id = ANY(_quiz_ids)
    AND (q.published = true
         OR private.has_role(auth.uid(), 'admin'::app_role)
         OR private.has_role(auth.uid(), 'owner'::app_role))
  GROUP BY qq.quiz_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_quiz_question_counts(uuid[]) TO anon, authenticated;

-- Include prompt alongside explanation for result pages (same access rules)
DROP FUNCTION IF EXISTS public.get_quiz_explanations(uuid[]);
CREATE FUNCTION public.get_quiz_explanations(_question_ids uuid[])
RETURNS TABLE(id uuid, prompt text, explanation text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT q.id, q.prompt, q.explanation
  FROM public.quiz_questions q
  WHERE q.id = ANY(_question_ids)
    AND (
      private.has_role(auth.uid(), 'admin'::app_role)
      OR private.has_role(auth.uid(), 'owner'::app_role)
      OR EXISTS (
        SELECT 1 FROM public.quiz_attempts a
        WHERE a.quiz_id = q.quiz_id AND a.user_id = auth.uid()
      )
    );
$$;

GRANT EXECUTE ON FUNCTION public.get_quiz_explanations(uuid[]) TO anon, authenticated;