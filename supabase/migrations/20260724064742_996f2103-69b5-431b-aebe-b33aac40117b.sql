
CREATE TABLE public.user_skripts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  uploaded_by UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  size_bytes BIGINT,
  version TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  downloads BIGINT NOT NULL DEFAULT 0,
  published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.user_skripts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_skripts TO authenticated;
GRANT ALL ON public.user_skripts TO service_role;

ALTER TABLE public.user_skripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published skripts"
  ON public.user_skripts FOR SELECT
  USING (published = true OR uploaded_by = auth.uid() OR public.is_staff_user(auth.uid()));

CREATE POLICY "Users can insert their own skripts"
  ON public.user_skripts FOR INSERT
  WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Users can update their own skripts"
  ON public.user_skripts FOR UPDATE
  USING (auth.uid() = uploaded_by OR public.is_staff_user(auth.uid()))
  WITH CHECK (auth.uid() = uploaded_by OR public.is_staff_user(auth.uid()));

CREATE POLICY "Users can delete their own skripts"
  ON public.user_skripts FOR DELETE
  USING (auth.uid() = uploaded_by OR public.is_staff_user(auth.uid()));

CREATE TRIGGER user_skripts_updated_at
  BEFORE UPDATE ON public.user_skripts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX user_skripts_uploaded_by_idx ON public.user_skripts (uploaded_by);
CREATE INDEX user_skripts_created_at_idx ON public.user_skripts (created_at DESC);

CREATE OR REPLACE FUNCTION public.record_user_skript_download(_skript_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.user_skripts SET downloads = downloads + 1
  WHERE id = _skript_id AND published = true;
END;
$$;
