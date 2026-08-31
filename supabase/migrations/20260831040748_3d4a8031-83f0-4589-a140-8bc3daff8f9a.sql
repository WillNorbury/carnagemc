ALTER TABLE public.tab_animations ADD COLUMN IF NOT EXISTS user_id uuid;

CREATE POLICY "Users manage own tab animations"
ON public.tab_animations
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public read published server animations"
ON public.tab_animations
FOR SELECT
TO anon, authenticated
USING (published = true AND user_id IS NULL);