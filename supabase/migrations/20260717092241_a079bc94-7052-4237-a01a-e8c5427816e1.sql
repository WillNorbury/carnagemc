
ALTER TABLE public.status_subscribers
  ADD COLUMN IF NOT EXISTS unsubscribe_token UUID NOT NULL DEFAULT gen_random_uuid();

CREATE UNIQUE INDEX IF NOT EXISTS status_subscribers_unsubscribe_token_key
  ON public.status_subscribers (unsubscribe_token);

CREATE OR REPLACE FUNCTION public.status_unsubscribe(_token uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  removed int;
BEGIN
  DELETE FROM public.status_subscribers WHERE unsubscribe_token = _token;
  GET DIAGNOSTICS removed = ROW_COUNT;
  RETURN removed > 0;
END;
$$;

REVOKE ALL ON FUNCTION public.status_unsubscribe(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.status_unsubscribe(uuid) TO anon, authenticated;
