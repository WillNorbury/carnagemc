
-- Create public storage bucket for plugin .jar files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('plugin-jars', 'plugin-jars', true, 104857600, ARRAY['application/java-archive','application/x-java-archive','application/octet-stream','application/zip'])
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 104857600, allowed_mime_types = ARRAY['application/java-archive','application/x-java-archive','application/octet-stream','application/zip'];

-- Public read
CREATE POLICY "Plugin jars are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'plugin-jars');

-- Admin upload/update/delete
CREATE POLICY "Admins upload plugin jars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'plugin-jars' AND private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update plugin jars"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'plugin-jars' AND private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete plugin jars"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'plugin-jars' AND private.has_role(auth.uid(), 'admin'::app_role));

-- Add file_name column to track uploaded jar storage path
ALTER TABLE public.plugins ADD COLUMN IF NOT EXISTS jar_path text;
ALTER TABLE public.plugins ADD COLUMN IF NOT EXISTS jar_filename text;
ALTER TABLE public.plugins ADD COLUMN IF NOT EXISTS jar_size bigint;
