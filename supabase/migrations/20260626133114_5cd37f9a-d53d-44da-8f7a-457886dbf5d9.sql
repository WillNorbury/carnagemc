
INSERT INTO public.allowed_from_addresses (email, display_name, created_by)
VALUES
  ('admin@carnagemc.net', 'CarnageMC Admin', NULL),
  ('admin@notify.carnagemc.net', 'CarnageMC Admin', NULL)
ON CONFLICT (email) DO NOTHING;
