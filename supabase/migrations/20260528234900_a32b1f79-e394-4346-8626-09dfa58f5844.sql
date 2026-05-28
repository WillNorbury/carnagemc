
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;

CREATE TABLE IF NOT EXISTS public.mod_likes (
  user_id UUID NOT NULL,
  mod_id UUID NOT NULL REFERENCES public.mods(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, mod_id)
);
GRANT SELECT ON public.mod_likes TO anon;
GRANT SELECT, INSERT, DELETE ON public.mod_likes TO authenticated;
GRANT ALL ON public.mod_likes TO service_role;
ALTER TABLE public.mod_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mod_likes public read" ON public.mod_likes FOR SELECT USING (true);
CREATE POLICY "mod_likes user insert" ON public.mod_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "mod_likes user delete" ON public.mod_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.mod_saves (
  user_id UUID NOT NULL,
  mod_id UUID NOT NULL REFERENCES public.mods(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, mod_id)
);
GRANT SELECT, INSERT, DELETE ON public.mod_saves TO authenticated;
GRANT ALL ON public.mod_saves TO service_role;
ALTER TABLE public.mod_saves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mod_saves owner read" ON public.mod_saves FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "mod_saves user insert" ON public.mod_saves FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "mod_saves user delete" ON public.mod_saves FOR DELETE TO authenticated USING (auth.uid() = user_id);
