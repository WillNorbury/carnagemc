
CREATE TABLE public.status_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  confirmed BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX status_subscribers_email_key ON public.status_subscribers (lower(email));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.status_subscribers TO authenticated;
GRANT INSERT ON public.status_subscribers TO anon;
GRANT ALL ON public.status_subscribers TO service_role;

ALTER TABLE public.status_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can subscribe"
  ON public.status_subscribers FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Users view their own subscription"
  ON public.status_subscribers FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Users delete their own subscription"
  ON public.status_subscribers FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() OR private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Admins update subscriptions"
  ON public.status_subscribers FOR UPDATE
  TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'owner'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'owner'::app_role));
