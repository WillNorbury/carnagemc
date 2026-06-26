
-- 1) Move Discord identity fields off the publicly-readable profiles table into a private, owner-only table.
CREATE TABLE IF NOT EXISTS public.profiles_private (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  discord_id text,
  discord_username text,
  discord_avatar text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles_private TO authenticated;
GRANT ALL ON public.profiles_private TO service_role;

ALTER TABLE public.profiles_private ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own private profile" ON public.profiles_private
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users upsert own private profile" ON public.profiles_private
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own private profile" ON public.profiles_private
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own private profile" ON public.profiles_private
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER profiles_private_set_updated_at
  BEFORE UPDATE ON public.profiles_private
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Backfill from existing profiles rows
INSERT INTO public.profiles_private (user_id, discord_id, discord_username, discord_avatar)
SELECT id, discord_id, discord_username, discord_avatar
FROM public.profiles
WHERE discord_id IS NOT NULL OR discord_username IS NOT NULL OR discord_avatar IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;

-- 2) Drop the Discord columns from public.profiles entirely so they cannot be exposed.
ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS discord_id,
  DROP COLUMN IF EXISTS discord_username,
  DROP COLUMN IF EXISTS discord_avatar;

-- 3) Update the helper RPC to source private fields from the new table.
CREATE OR REPLACE FUNCTION public.get_my_private_profile()
RETURNS TABLE(preferences jsonb, discord_id text, discord_username text, discord_avatar text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT p.preferences, pp.discord_id, pp.discord_username, pp.discord_avatar
  FROM public.profiles p
  LEFT JOIN public.profiles_private pp ON pp.user_id = p.id
  WHERE p.id = auth.uid();
$$;

-- 4) Restrict organization_members SELECT to authenticated users.
DROP POLICY IF EXISTS "Organization members are publicly viewable" ON public.organization_members;
CREATE POLICY "Organization members viewable to authenticated"
  ON public.organization_members
  FOR SELECT TO authenticated
  USING (true);
REVOKE SELECT ON public.organization_members FROM anon;

-- 5) quiz_options: ensure no public SELECT path exists (admin-only ALL policy already restricts it; revoke any leftover grants).
REVOKE SELECT ON public.quiz_options FROM anon, authenticated;
