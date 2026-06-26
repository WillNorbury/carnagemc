CREATE TABLE public.email_template_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name text NOT NULL,
  variant text NOT NULL DEFAULT 'default',
  subject text NOT NULL,
  body_markdown text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (template_name, variant)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_template_overrides TO authenticated;
GRANT ALL ON public.email_template_overrides TO service_role;

ALTER TABLE public.email_template_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admins read overrides" ON public.email_template_overrides
  FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(),'admin'::app_role) OR private.has_role(auth.uid(),'owner'::app_role));

CREATE POLICY "admins write overrides" ON public.email_template_overrides
  FOR INSERT TO authenticated
  WITH CHECK (private.has_role(auth.uid(),'admin'::app_role) OR private.has_role(auth.uid(),'owner'::app_role));

CREATE POLICY "admins update overrides" ON public.email_template_overrides
  FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(),'admin'::app_role) OR private.has_role(auth.uid(),'owner'::app_role))
  WITH CHECK (private.has_role(auth.uid(),'admin'::app_role) OR private.has_role(auth.uid(),'owner'::app_role));

CREATE POLICY "admins delete overrides" ON public.email_template_overrides
  FOR DELETE TO authenticated
  USING (private.has_role(auth.uid(),'admin'::app_role) OR private.has_role(auth.uid(),'owner'::app_role));

CREATE TRIGGER set_email_template_overrides_updated_at
  BEFORE UPDATE ON public.email_template_overrides
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();