-- Add priority to news
ALTER TABLE public.news ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'normal';

-- Create news-covers storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('news-covers', 'news-covers', true)
ON CONFLICT (id) DO NOTHING;

-- Public can read; only admins can upload/update/delete
CREATE POLICY "Public read news covers"
ON storage.objects FOR SELECT
USING (bucket_id = 'news-covers');

CREATE POLICY "Admins upload news covers"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'news-covers' AND private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update news covers"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'news-covers' AND private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete news covers"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'news-covers' AND private.has_role(auth.uid(), 'admin'::app_role));