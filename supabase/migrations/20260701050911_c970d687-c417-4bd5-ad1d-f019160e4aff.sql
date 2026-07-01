-- Backfill created_by for existing mc_servers rows to the sole owner
UPDATE public.mc_servers SET created_by = 'a9ff5e2f-cad4-4805-9acd-095065d18179'::uuid WHERE created_by IS NULL;

-- Require created_by going forward
ALTER TABLE public.mc_servers ALTER COLUMN created_by SET NOT NULL;

-- Replace the blanket owner policy with per-row ownership scoping so ingest_secret
-- is only readable by the server's creator.
DROP POLICY IF EXISTS "Owners manage mc_servers" ON public.mc_servers;

CREATE POLICY "Owners read own mc_servers"
  ON public.mc_servers FOR SELECT
  USING (private.has_role(auth.uid(), 'owner'::app_role) AND created_by = auth.uid());

CREATE POLICY "Owners insert own mc_servers"
  ON public.mc_servers FOR INSERT
  WITH CHECK (private.has_role(auth.uid(), 'owner'::app_role) AND created_by = auth.uid());

CREATE POLICY "Owners update own mc_servers"
  ON public.mc_servers FOR UPDATE
  USING (private.has_role(auth.uid(), 'owner'::app_role) AND created_by = auth.uid())
  WITH CHECK (private.has_role(auth.uid(), 'owner'::app_role) AND created_by = auth.uid());

CREATE POLICY "Owners delete own mc_servers"
  ON public.mc_servers FOR DELETE
  USING (private.has_role(auth.uid(), 'owner'::app_role) AND created_by = auth.uid());