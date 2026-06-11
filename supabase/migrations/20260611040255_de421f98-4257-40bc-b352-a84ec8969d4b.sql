CREATE TABLE public.website_webhook_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempted_at timestamptz NOT NULL DEFAULT now(),
  kind text NOT NULL,
  url_host text,
  status_code int,
  ok boolean NOT NULL DEFAULT false,
  error text,
  latency_ms int
);

GRANT SELECT ON public.website_webhook_deliveries TO authenticated;
GRANT ALL ON public.website_webhook_deliveries TO service_role;

ALTER TABLE public.website_webhook_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and owners can read website webhook deliveries"
ON public.website_webhook_deliveries FOR SELECT
TO authenticated
USING (private.has_role(auth.uid(),'admin'::app_role) OR private.has_role(auth.uid(),'owner'::app_role));

CREATE INDEX website_webhook_deliveries_attempted_at_idx
  ON public.website_webhook_deliveries (attempted_at DESC);