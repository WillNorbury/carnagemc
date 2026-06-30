
-- =========================================================
-- Minecraft console bridge
-- =========================================================

-- mc_servers
CREATE TABLE public.mc_servers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  ingest_secret TEXT NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  enabled BOOLEAN NOT NULL DEFAULT true,
  last_seen_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.mc_servers TO authenticated;
GRANT ALL ON public.mc_servers TO service_role;

ALTER TABLE public.mc_servers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage mc_servers"
  ON public.mc_servers FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'owner'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'owner'::app_role));

CREATE TRIGGER mc_servers_set_updated_at
  BEFORE UPDATE ON public.mc_servers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- mc_console_commands
CREATE TABLE public.mc_console_commands (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  server_id UUID NOT NULL REFERENCES public.mc_servers(id) ON DELETE CASCADE,
  command TEXT NOT NULL,
  issued_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','sent','done','error')),
  response TEXT,
  sent_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX mc_console_commands_pending_idx
  ON public.mc_console_commands (server_id, status, created_at)
  WHERE status = 'pending';

GRANT SELECT, INSERT, UPDATE, DELETE ON public.mc_console_commands TO authenticated;
GRANT ALL ON public.mc_console_commands TO service_role;

ALTER TABLE public.mc_console_commands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners view mc_console_commands"
  ON public.mc_console_commands FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Owners insert mc_console_commands"
  ON public.mc_console_commands FOR INSERT TO authenticated
  WITH CHECK (
    private.has_role(auth.uid(), 'owner'::app_role)
    AND issued_by = auth.uid()
  );

-- mc_console_logs
CREATE TABLE public.mc_console_logs (
  id BIGSERIAL PRIMARY KEY,
  server_id UUID NOT NULL REFERENCES public.mc_servers(id) ON DELETE CASCADE,
  level TEXT NOT NULL DEFAULT 'INFO'
    CHECK (level IN ('INFO','WARN','ERROR','DEBUG')),
  source TEXT NOT NULL DEFAULT 'server',
  line TEXT NOT NULL,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX mc_console_logs_server_time_idx
  ON public.mc_console_logs (server_id, logged_at DESC);

GRANT SELECT ON public.mc_console_logs TO authenticated;
GRANT ALL ON public.mc_console_logs TO service_role;

ALTER TABLE public.mc_console_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners view mc_console_logs"
  ON public.mc_console_logs FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'owner'::app_role));

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.mc_console_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.mc_console_commands;

-- Helper: rotate a server's ingest secret (owner-only)
CREATE OR REPLACE FUNCTION public.mc_server_rotate_secret(_server_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_secret TEXT;
BEGIN
  IF NOT private.has_role(auth.uid(), 'owner'::app_role) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  new_secret := encode(gen_random_bytes(32), 'hex');
  UPDATE public.mc_servers SET ingest_secret = new_secret, updated_at = now()
    WHERE id = _server_id;
  RETURN new_secret;
END;
$$;
