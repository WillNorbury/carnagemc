
ALTER TABLE public.plugins ADD COLUMN IF NOT EXISTS screenshots text[] NOT NULL DEFAULT '{}';

INSERT INTO storage.buckets (id, name, public)
VALUES ('plugin-screenshots', 'plugin-screenshots', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Plugin screenshots public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'plugin-screenshots');

CREATE POLICY "Admins upload plugin screenshots"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'plugin-screenshots' AND private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update plugin screenshots"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'plugin-screenshots' AND private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete plugin screenshots"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'plugin-screenshots' AND private.has_role(auth.uid(), 'admin'::app_role));
