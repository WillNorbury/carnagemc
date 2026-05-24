ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS discord_id text UNIQUE,
  ADD COLUMN IF NOT EXISTS discord_username text,
  ADD COLUMN IF NOT EXISTS discord_avatar text;

CREATE TABLE IF NOT EXISTS public.discord_link_states (
  state text PRIMARY KEY,
  user_id uuid NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '10 minutes'),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.discord_link_states ENABLE ROW LEVEL SECURITY;
-- No policies: only service role can access.