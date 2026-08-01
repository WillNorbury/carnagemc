-- applications.reviewer_notes: hide from non-admin readers
REVOKE SELECT ON public.applications FROM anon, authenticated;
GRANT SELECT (id, user_id, type, status, mc_username, discord, age, timezone, experience, why, portfolio_url, extra, reviewed_by, reviewed_at, created_at, updated_at)
  ON public.applications TO authenticated;

-- user_reports.admin_notes: hide from reporters
REVOKE SELECT ON public.user_reports FROM anon, authenticated;
GRANT SELECT (id, reporter_id, target_type, target_id, target_label, target_url, reason, details, status, resolved_at, resolved_by, created_at, updated_at)
  ON public.user_reports TO authenticated;

-- quiz_questions.explanation: hide until attempt submitted
REVOKE SELECT ON public.quiz_questions FROM anon, authenticated;
GRANT SELECT (id, quiz_id, prompt, points, sort_order, created_at)
  ON public.quiz_questions TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.admin_get_application_notes(_ids uuid[])
RETURNS TABLE(id uuid, reviewer_notes text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT (private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'owner'::app_role)) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  RETURN QUERY SELECT a.id, a.reviewer_notes FROM public.applications a WHERE a.id = ANY(_ids);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_get_report_notes(_ids uuid[])
RETURNS TABLE(id uuid, admin_notes text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT (private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'owner'::app_role)) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  RETURN QUERY SELECT r.id, r.admin_notes FROM public.user_reports r WHERE r.id = ANY(_ids);
END;
$$;

-- Explanations: admins always, users only for quizzes they have already attempted
CREATE OR REPLACE FUNCTION public.get_quiz_explanations(_question_ids uuid[])
RETURNS TABLE(id uuid, explanation text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT q.id, q.explanation
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

REVOKE EXECUTE ON FUNCTION public.admin_get_application_notes(uuid[]) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_get_report_notes(uuid[]) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_quiz_explanations(uuid[]) FROM anon;
