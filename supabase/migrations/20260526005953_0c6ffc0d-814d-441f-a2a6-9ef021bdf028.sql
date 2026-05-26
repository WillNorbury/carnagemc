
-- 1) Restrict anonymous reads on profiles to safe columns only
REVOKE SELECT ON public.profiles FROM anon;
GRANT SELECT (id, display_name, avatar_url, mc_username, created_at, updated_at) ON public.profiles TO anon;

-- Also limit authenticated users so they cannot read other users' preferences / Discord identity
REVOKE SELECT ON public.profiles FROM authenticated;
GRANT SELECT (id, display_name, avatar_url, mc_username, created_at, updated_at) ON public.profiles TO authenticated;

-- Allow each user to read all of their own profile columns (including preferences + Discord fields)
CREATE POLICY "Users view own full profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Allow admins to read all profile columns
CREATE POLICY "Admins view all profile columns"
ON public.profiles
FOR SELECT
TO authenticated
USING (private.has_role(auth.uid(), 'admin'::app_role));

-- Grant full column SELECT back to authenticated so the above policies can return sensitive columns
GRANT SELECT (preferences, discord_id, discord_username, discord_avatar) ON public.profiles TO authenticated;

-- 2) Add explicit owner-only SELECT policy on discord_link_states
CREATE POLICY "Users view own link states"
ON public.discord_link_states
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 3) Remove broad listing policies on public storage buckets.
-- Files remain downloadable via public URLs because the buckets are public,
-- but anonymous clients can no longer enumerate (list) all objects.
DROP POLICY IF EXISTS "Plugin jars are publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "Plugin screenshots public read" ON storage.objects;
DROP POLICY IF EXISTS "Public read news covers" ON storage.objects;
