
ALTER TABLE public.contact_messages
  ADD COLUMN IF NOT EXISTS reply_text TEXT,
  ADD COLUMN IF NOT EXISTS replied_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS replied_by UUID;

INSERT INTO public.allowed_from_addresses (email, display_name, created_by)
VALUES
  ('contact@carnagemc.net', 'CarnageMC Contact', NULL),
  ('contact@notify.carnagemc.net', 'CarnageMC Contact', NULL)
ON CONFLICT (email) DO NOTHING;
