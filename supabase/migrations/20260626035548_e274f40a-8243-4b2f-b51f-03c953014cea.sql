
CREATE TABLE public.admin_broadcast_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sender_email TEXT,
  category TEXT NOT NULL,
  from_address TEXT,
  subject TEXT NOT NULL,
  message_preview TEXT,
  total_recipients INTEGER NOT NULL DEFAULT 0,
  queued_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  test_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.admin_broadcast_logs TO authenticated;
GRANT ALL ON public.admin_broadcast_logs TO service_role;

ALTER TABLE public.admin_broadcast_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view broadcast logs"
ON public.admin_broadcast_logs
FOR SELECT
TO authenticated
USING (private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'owner'::app_role));

CREATE INDEX idx_admin_broadcast_logs_created_at ON public.admin_broadcast_logs (created_at DESC);
