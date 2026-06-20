
-- ============================================================
-- FAQ VOTES
-- ============================================================
CREATE TABLE public.faq_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  faq_id uuid NOT NULL REFERENCES public.faqs(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  voter_key text,
  vote text NOT NULL CHECK (vote IN ('helpful', 'not_helpful')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX faq_votes_user_unique ON public.faq_votes(faq_id, user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX faq_votes_anon_unique ON public.faq_votes(faq_id, voter_key) WHERE user_id IS NULL AND voter_key IS NOT NULL;
CREATE INDEX faq_votes_faq_idx ON public.faq_votes(faq_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.faq_votes TO authenticated;
GRANT SELECT, INSERT ON public.faq_votes TO anon;
GRANT ALL ON public.faq_votes TO service_role;

ALTER TABLE public.faq_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read faq votes" ON public.faq_votes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anon can insert anonymous vote" ON public.faq_votes FOR INSERT TO anon
  WITH CHECK (user_id IS NULL AND voter_key IS NOT NULL AND length(voter_key) BETWEEN 8 AND 128);
CREATE POLICY "Authed can insert own vote" ON public.faq_votes FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Authed can update own vote" ON public.faq_votes FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Authed can delete own vote" ON public.faq_votes FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Public aggregate view
CREATE OR REPLACE VIEW public.faq_vote_counts AS
SELECT
  faq_id,
  count(*) FILTER (WHERE vote = 'helpful')::int AS helpful,
  count(*) FILTER (WHERE vote = 'not_helpful')::int AS not_helpful
FROM public.faq_votes
GROUP BY faq_id;

GRANT SELECT ON public.faq_vote_counts TO anon, authenticated;

-- ============================================================
-- QUIZZES
-- ============================================================
CREATE TABLE public.quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'general',
  passing_score int NOT NULL DEFAULT 70 CHECK (passing_score BETWEEN 0 AND 100),
  time_limit_seconds int,
  randomize boolean NOT NULL DEFAULT false,
  published boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.quizzes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quizzes TO authenticated;
GRANT ALL ON public.quizzes TO service_role;

ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published quizzes" ON public.quizzes FOR SELECT TO anon, authenticated
  USING (published = true OR private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'owner'::app_role));
CREATE POLICY "Admins manage quizzes" ON public.quizzes FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'owner'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'owner'::app_role));

CREATE TRIGGER quizzes_set_updated_at BEFORE UPDATE ON public.quizzes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- QUIZ QUESTIONS
-- ============================================================
CREATE TABLE public.quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  prompt text NOT NULL,
  explanation text,
  points int NOT NULL DEFAULT 1 CHECK (points > 0),
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX quiz_questions_quiz_idx ON public.quiz_questions(quiz_id, sort_order);

GRANT SELECT ON public.quiz_questions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_questions TO authenticated;
GRANT ALL ON public.quiz_questions TO service_role;

ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read questions of published quizzes" ON public.quiz_questions FOR SELECT TO anon, authenticated
  USING (
    EXISTS (SELECT 1 FROM public.quizzes q WHERE q.id = quiz_id AND q.published = true)
    OR private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'owner'::app_role)
  );
CREATE POLICY "Admins manage questions" ON public.quiz_questions FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'owner'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'owner'::app_role));

-- ============================================================
-- QUIZ OPTIONS (NO is_correct exposed publicly)
-- ============================================================
CREATE TABLE public.quiz_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  label text NOT NULL,
  is_correct boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX quiz_options_question_idx ON public.quiz_options(question_id, sort_order);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_options TO authenticated;
GRANT ALL ON public.quiz_options TO service_role;
-- Note: NO anon grant. Public reads go through get_quiz_with_questions() which hides is_correct.

ALTER TABLE public.quiz_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage options" ON public.quiz_options FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'owner'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'owner'::app_role));

-- ============================================================
-- QUIZ ATTEMPTS
-- ============================================================
CREATE TABLE public.quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score int NOT NULL,
  max_score int NOT NULL,
  percent numeric(5,2) NOT NULL,
  duration_seconds int NOT NULL DEFAULT 0,
  passed boolean NOT NULL DEFAULT false,
  answers jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX quiz_attempts_quiz_user_idx ON public.quiz_attempts(quiz_id, user_id);
CREATE INDEX quiz_attempts_leaderboard_idx ON public.quiz_attempts(quiz_id, percent DESC, duration_seconds ASC, created_at ASC);

GRANT SELECT ON public.quiz_attempts TO authenticated;
GRANT ALL ON public.quiz_attempts TO service_role;
-- No INSERT grant: attempts only insert via submit_quiz_attempt() SECURITY DEFINER.

ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own attempts" ON public.quiz_attempts FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'owner'::app_role));

-- ============================================================
-- PUBLIC SECURITY DEFINER FUNCTIONS
-- ============================================================

-- Returns the quiz with questions + options WITHOUT is_correct flags.
CREATE OR REPLACE FUNCTION public.get_quiz_with_questions(_slug text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  q public.quizzes;
  result jsonb;
BEGIN
  SELECT * INTO q FROM public.quizzes WHERE slug = _slug
    AND (published = true OR private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'owner'::app_role));
  IF NOT FOUND THEN RETURN NULL; END IF;

  SELECT jsonb_build_object(
    'id', q.id,
    'slug', q.slug,
    'title', q.title,
    'description', q.description,
    'category', q.category,
    'passing_score', q.passing_score,
    'time_limit_seconds', q.time_limit_seconds,
    'randomize', q.randomize,
    'questions', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', qq.id,
        'prompt', qq.prompt,
        'points', qq.points,
        'sort_order', qq.sort_order,
        'options', COALESCE((
          SELECT jsonb_agg(jsonb_build_object('id', qo.id, 'label', qo.label, 'sort_order', qo.sort_order)
                           ORDER BY qo.sort_order, qo.created_at)
          FROM public.quiz_options qo WHERE qo.question_id = qq.id
        ), '[]'::jsonb)
      ) ORDER BY qq.sort_order, qq.created_at)
      FROM public.quiz_questions qq WHERE qq.quiz_id = q.id
    ), '[]'::jsonb)
  ) INTO result;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_quiz_with_questions(text) TO anon, authenticated;

-- Submits an attempt; server recomputes the score.
-- _answers: jsonb array of {question_id, option_id}
CREATE OR REPLACE FUNCTION public.submit_quiz_attempt(_quiz_id uuid, _answers jsonb, _duration_seconds int)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  q public.quizzes;
  total_score int := 0;
  total_max int := 0;
  ans jsonb;
  qq_id uuid;
  opt_id uuid;
  opt_correct boolean;
  qq_points int;
  graded jsonb := '[]'::jsonb;
  pct numeric(5,2);
  attempt_id uuid;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT * INTO q FROM public.quizzes WHERE id = _quiz_id AND published = true;
  IF NOT FOUND THEN RAISE EXCEPTION 'quiz not found or not published'; END IF;

  -- Iterate over every question of the quiz so unanswered = 0
  FOR qq_id, qq_points IN
    SELECT id, points FROM public.quiz_questions WHERE quiz_id = _quiz_id
  LOOP
    total_max := total_max + qq_points;
    -- Find the user's answer for this question
    SELECT a INTO ans FROM jsonb_array_elements(_answers) a WHERE (a->>'question_id')::uuid = qq_id LIMIT 1;
    opt_id := NULL;
    opt_correct := false;
    IF ans IS NOT NULL AND (ans->>'option_id') IS NOT NULL THEN
      opt_id := (ans->>'option_id')::uuid;
      SELECT is_correct INTO opt_correct FROM public.quiz_options WHERE id = opt_id AND question_id = qq_id;
      opt_correct := COALESCE(opt_correct, false);
      IF opt_correct THEN total_score := total_score + qq_points; END IF;
    END IF;
    graded := graded || jsonb_build_object('question_id', qq_id, 'option_id', opt_id, 'correct', opt_correct);
  END LOOP;

  pct := CASE WHEN total_max = 0 THEN 0 ELSE ROUND(100.0 * total_score / total_max, 2) END;

  INSERT INTO public.quiz_attempts (quiz_id, user_id, score, max_score, percent, duration_seconds, passed, answers)
  VALUES (_quiz_id, uid, total_score, total_max, pct, GREATEST(_duration_seconds, 0), pct >= q.passing_score, graded)
  RETURNING id INTO attempt_id;

  RETURN attempt_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_quiz_attempt(uuid, jsonb, int) TO authenticated;

-- Leaderboard: best attempt per user, ranked.
CREATE OR REPLACE FUNCTION public.get_quiz_leaderboard(_slug text, _limit int DEFAULT 50)
RETURNS TABLE(
  rank bigint,
  user_id uuid,
  display_name text,
  avatar_url text,
  percent numeric,
  score int,
  max_score int,
  duration_seconds int,
  created_at timestamptz
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  WITH q AS (SELECT id FROM public.quizzes WHERE slug = _slug AND published = true),
  best AS (
    SELECT DISTINCT ON (a.user_id)
      a.user_id, a.percent, a.score, a.max_score, a.duration_seconds, a.created_at
    FROM public.quiz_attempts a
    JOIN q ON q.id = a.quiz_id
    ORDER BY a.user_id, a.percent DESC, a.duration_seconds ASC, a.created_at ASC
  )
  SELECT
    ROW_NUMBER() OVER (ORDER BY b.percent DESC, b.duration_seconds ASC, b.created_at ASC) AS rank,
    b.user_id,
    p.display_name,
    p.avatar_url,
    b.percent,
    b.score,
    b.max_score,
    b.duration_seconds,
    b.created_at
  FROM best b
  LEFT JOIN public.profiles p ON p.id = b.user_id
  ORDER BY rank
  LIMIT GREATEST(_limit, 1);
$$;

GRANT EXECUTE ON FUNCTION public.get_quiz_leaderboard(text, int) TO anon, authenticated;
