CREATE TABLE public.discord_bot_action_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  action text NOT NULL,
  status text NOT NULL,
  request jsonb NOT NULL DEFAULT '{}'::jsonb,
  response jsonb,
  error text,
  channel_id text,
  message_id text,
  http_status integer,
  duration_ms integer,
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_discord_bot_logs_created_at ON public.discord_bot_action_logs (created_at DESC);
CREATE INDEX idx_discord_bot_logs_action ON public.discord_bot_action_logs (action, created_at DESC);

ALTER TABLE public.discord_bot_action_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view discord bot logs"
  ON public.discord_bot_action_logs
  FOR SELECT
  TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete discord bot logs"
  ON public.discord_bot_action_logs
  FOR DELETE
  TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role));