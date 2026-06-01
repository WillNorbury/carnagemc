
-- 1) Add user_id ownership column to plugins
ALTER TABLE public.plugins
  ADD COLUMN IF NOT EXISTS user_id uuid;

CREATE INDEX IF NOT EXISTS idx_plugins_user_id ON public.plugins(user_id);

-- 2) RLS policies for non-admin owners
DROP POLICY IF EXISTS "Owners view their plugins" ON public.plugins;
CREATE POLICY "Owners view their plugins"
ON public.plugins
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Owners insert plugins" ON public.plugins;
CREATE POLICY "Owners insert plugins"
ON public.plugins
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Owners update their plugins" ON public.plugins;
CREATE POLICY "Owners update their plugins"
ON public.plugins
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Owners delete their plugins" ON public.plugins;
CREATE POLICY "Owners delete their plugins"
ON public.plugins
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 3) Storage policies: allow authenticated users to manage files within
--    a folder named after their auth uid in plugin-jars and plugin-screenshots
DROP POLICY IF EXISTS "Users upload own plugin jars" ON storage.objects;
CREATE POLICY "Users upload own plugin jars"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'plugin-jars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users update own plugin jars" ON storage.objects;
CREATE POLICY "Users update own plugin jars"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'plugin-jars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users delete own plugin jars" ON storage.objects;
CREATE POLICY "Users delete own plugin jars"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'plugin-jars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users upload own plugin screenshots" ON storage.objects;
CREATE POLICY "Users upload own plugin screenshots"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'plugin-screenshots'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users update own plugin screenshots" ON storage.objects;
CREATE POLICY "Users update own plugin screenshots"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'plugin-screenshots'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users delete own plugin screenshots" ON storage.objects;
CREATE POLICY "Users delete own plugin screenshots"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'plugin-screenshots'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
