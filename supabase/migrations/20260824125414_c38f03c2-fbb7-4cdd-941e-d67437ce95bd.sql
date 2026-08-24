CREATE TABLE public.account_removal_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  username text NOT NULL,
  email text,
  action text NOT NULL DEFAULT 'deleted',
  reason text,
  notes text,
  actor_id uuid,
  actor_name text,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT account_removal_log_action_check CHECK (action IN ('deleted','banned','suspended','restored'))
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.account_removal_log TO authenticated;
GRANT ALL ON public.account_removal_log TO service_role;

ALTER TABLE public.account_removal_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view removal log"
  ON public.account_removal_log FOR SELECT TO authenticated
  USING (public.is_current_user_admin());

CREATE POLICY "Admins can insert removal log"
  ON public.account_removal_log FOR INSERT TO authenticated
  WITH CHECK (public.is_current_user_admin());

CREATE POLICY "Admins can update removal log"
  ON public.account_removal_log FOR UPDATE TO authenticated
  USING (public.is_current_user_admin());

CREATE POLICY "Admins can delete removal log"
  ON public.account_removal_log FOR DELETE TO authenticated
  USING (public.is_current_user_admin());

CREATE TRIGGER account_removal_log_set_updated_at
  BEFORE UPDATE ON public.account_removal_log
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_account_removal_log_occurred_at ON public.account_removal_log (occurred_at DESC);

-- Auto-log when a profile row disappears (account deleted)
CREATE OR REPLACE FUNCTION public.log_profile_deletion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.account_removal_log (user_id, username, action, reason, actor_id)
  VALUES (OLD.id, COALESCE(OLD.display_name, OLD.id::text), 'deleted', 'Account removed', auth.uid());
  RETURN OLD;
END;
$$;

CREATE TRIGGER trg_log_profile_deletion
  BEFORE DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.log_profile_deletion();