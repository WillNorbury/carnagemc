
CREATE TABLE public.admin_skripts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  size_bytes BIGINT,
  version TEXT,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_skripts TO authenticated;
GRANT ALL ON public.admin_skripts TO service_role;

ALTER TABLE public.admin_skripts ENABLE ROW LEVEL SECURITY;

-- Helper: is the user staff-level (any staff role)?
CREATE OR REPLACE FUNCTION public.is_staff_user(_uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _uid
      AND role IN ('owner','manager','developer','sr_admin','admin','sr_mod','mod','sr_helper','helper')
  );
$$;

CREATE POLICY "Staff can view skripts"
  ON public.admin_skripts FOR SELECT
  TO authenticated
  USING (public.is_staff_user(auth.uid()));

CREATE POLICY "Staff can insert skripts"
  ON public.admin_skripts FOR INSERT
  TO authenticated
  WITH CHECK (public.is_staff_user(auth.uid()) AND uploaded_by = auth.uid());

CREATE POLICY "Staff can update skripts"
  ON public.admin_skripts FOR UPDATE
  TO authenticated
  USING (public.is_staff_user(auth.uid()))
  WITH CHECK (public.is_staff_user(auth.uid()));

CREATE POLICY "Admins can delete skripts"
  ON public.admin_skripts FOR DELETE
  TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'owner'::app_role));

CREATE TRIGGER admin_skripts_set_updated_at
  BEFORE UPDATE ON public.admin_skripts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Storage policies on the private `skripts` bucket
CREATE POLICY "Staff can read skript files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'skripts' AND public.is_staff_user(auth.uid()));

CREATE POLICY "Staff can upload skript files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'skripts' AND public.is_staff_user(auth.uid()));

CREATE POLICY "Staff can update skript files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'skripts' AND public.is_staff_user(auth.uid()));

CREATE POLICY "Admins can delete skript files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'skripts'
    AND (private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'owner'::app_role))
  );
