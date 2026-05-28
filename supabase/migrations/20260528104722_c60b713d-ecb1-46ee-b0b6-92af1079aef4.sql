
CREATE TABLE public.mod_reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mod_id uuid NOT NULL REFERENCES public.mods(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  rating smallint NOT NULL CHECK (rating >= 1 AND rating <= 5),
  body text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (mod_id, user_id)
);

CREATE INDEX idx_mod_reviews_mod ON public.mod_reviews(mod_id);
CREATE INDEX idx_mod_reviews_user ON public.mod_reviews(user_id);

GRANT SELECT ON public.mod_reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mod_reviews TO authenticated;
GRANT ALL ON public.mod_reviews TO service_role;

ALTER TABLE public.mod_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Mod reviews public read"
  ON public.mod_reviews FOR SELECT
  USING (true);

CREATE POLICY "Users insert own mod review"
  ON public.mod_reviews FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own mod review"
  ON public.mod_reviews FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own mod review"
  ON public.mod_reviews FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins manage mod reviews"
  ON public.mod_reviews FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER set_mod_reviews_updated_at
  BEFORE UPDATE ON public.mod_reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
