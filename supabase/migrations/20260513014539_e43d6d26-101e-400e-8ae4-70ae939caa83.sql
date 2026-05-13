
-- Changelog
CREATE TABLE public.changelog_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  category text NOT NULL DEFAULT 'update',
  version text,
  entry_date date NOT NULL DEFAULT (now()::date),
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.changelog_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Changelog published public read"
  ON public.changelog_entries FOR SELECT
  USING (published);

CREATE POLICY "Admins view all changelog"
  ON public.changelog_entries FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage changelog"
  ON public.changelog_entries FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER changelog_set_updated_at
  BEFORE UPDATE ON public.changelog_entries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_changelog_entry_date ON public.changelog_entries (entry_date DESC);

-- Applications
CREATE TYPE public.application_type AS ENUM ('staff', 'builder', 'youtuber');
CREATE TYPE public.application_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE public.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type public.application_type NOT NULL,
  status public.application_status NOT NULL DEFAULT 'pending',
  mc_username text NOT NULL,
  discord text,
  age int,
  timezone text,
  experience text,
  why text NOT NULL,
  portfolio_url text,
  extra jsonb NOT NULL DEFAULT '{}'::jsonb,
  reviewer_notes text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own applications"
  ON public.applications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins view all applications"
  ON public.applications FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users insert own application"
  ON public.applications FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins update applications"
  ON public.applications FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete applications"
  ON public.applications FOR DELETE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER applications_set_updated_at
  BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_applications_user ON public.applications (user_id);
CREATE INDEX idx_applications_status ON public.applications (status);
