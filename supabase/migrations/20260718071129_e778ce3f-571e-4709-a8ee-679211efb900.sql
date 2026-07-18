
CREATE TABLE public.store_wishlists (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id uuid NOT NULL REFERENCES public.store_items(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, item_id)
);
GRANT SELECT, INSERT, DELETE ON public.store_wishlists TO authenticated;
GRANT ALL ON public.store_wishlists TO service_role;
ALTER TABLE public.store_wishlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own wishlist select" ON public.store_wishlists FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own wishlist insert" ON public.store_wishlists FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own wishlist delete" ON public.store_wishlists FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX store_wishlists_user_idx ON public.store_wishlists(user_id);
