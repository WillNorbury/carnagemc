
CREATE TABLE public.item_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type text NOT NULL CHECK (target_type IN ('discover_item','plugin')),
  target_id uuid NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (target_type, target_id, user_id)
);

CREATE INDEX idx_item_reviews_target ON public.item_reviews (target_type, target_id);
CREATE INDEX idx_item_reviews_user ON public.item_reviews (user_id);

GRANT SELECT ON public.item_reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.item_reviews TO authenticated;
GRANT ALL ON public.item_reviews TO service_role;

ALTER TABLE public.item_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Item reviews public read"
  ON public.item_reviews FOR SELECT
  USING (true);

CREATE POLICY "Users insert own item review"
  ON public.item_reviews FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own item review"
  ON public.item_reviews FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own item review"
  ON public.item_reviews FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins manage item reviews"
  ON public.item_reviews FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'owner'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'owner'::app_role));

CREATE TRIGGER set_item_reviews_updated_at
  BEFORE UPDATE ON public.item_reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
