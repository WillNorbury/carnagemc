
CREATE TABLE public.trusted_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id text NOT NULL,
  ip text,
  user_agent text,
  trusted_until timestamptz NOT NULL,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, device_id)
);

GRANT SELECT, DELETE ON public.trusted_devices TO authenticated;
GRANT ALL ON public.trusted_devices TO service_role;
ALTER TABLE public.trusted_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own trusted devices"
  ON public.trusted_devices FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users revoke own trusted devices"
  ON public.trusted_devices FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE INDEX idx_trusted_devices_user ON public.trusted_devices(user_id);

CREATE TABLE public.login_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id text NOT NULL,
  code_hash text NOT NULL,
  ip text,
  user_agent text,
  attempts integer NOT NULL DEFAULT 0,
  consumed_at timestamptz,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.login_verifications TO service_role;
ALTER TABLE public.login_verifications ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_login_verifications_user ON public.login_verifications(user_id, created_at DESC);
