
-- News-specific opt-out list (managed server-side via edge function)
CREATE TABLE public.news_email_opt_outs (
  email TEXT PRIMARY KEY,
  user_id UUID,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.news_email_opt_outs TO authenticated;
GRANT ALL ON public.news_email_opt_outs TO service_role;

ALTER TABLE public.news_email_opt_outs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and owners view opt-outs"
ON public.news_email_opt_outs
FOR SELECT
TO authenticated
USING (
  private.has_role(auth.uid(), 'admin'::app_role)
  OR private.has_role(auth.uid(), 'owner'::app_role)
);

CREATE POLICY "Users can see their own opt-out"
ON public.news_email_opt_outs
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Per-news delivery log
CREATE TABLE public.news_email_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  news_id UUID NOT NULL REFERENCES public.news(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  error TEXT,
  message_id TEXT,
  is_test BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX news_email_deliveries_news_id_idx
  ON public.news_email_deliveries (news_id, created_at DESC);
CREATE INDEX news_email_deliveries_message_id_idx
  ON public.news_email_deliveries (message_id);

GRANT SELECT ON public.news_email_deliveries TO authenticated;
GRANT ALL ON public.news_email_deliveries TO service_role;

ALTER TABLE public.news_email_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and owners view delivery log"
ON public.news_email_deliveries
FOR SELECT
TO authenticated
USING (
  private.has_role(auth.uid(), 'admin'::app_role)
  OR private.has_role(auth.uid(), 'owner'::app_role)
);
