
-- 1) Remove the broad public SELECT policy that exposed voter_key
DROP POLICY IF EXISTS "Anyone can read faq votes" ON public.faq_votes;

-- 2) Revoke broad table SELECT from anon (authenticated keeps it for the next policy)
REVOKE SELECT ON public.faq_votes FROM anon;

-- 3) Allow authenticated users to read only their own rows
CREATE POLICY "Users view own faq votes"
ON public.faq_votes
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 4) Safe lookup for anonymous voters by their browser-local voter_key
CREATE OR REPLACE FUNCTION public.get_anon_faq_votes(_voter_key text)
RETURNS TABLE(faq_id uuid, vote text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT faq_id, vote
  FROM public.faq_votes
  WHERE user_id IS NULL
    AND voter_key = _voter_key;
$$;

GRANT EXECUTE ON FUNCTION public.get_anon_faq_votes(text) TO anon, authenticated;
