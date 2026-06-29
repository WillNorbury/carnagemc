INSERT INTO public.allowed_from_addresses (email, display_name)
VALUES
  ('passwords@carnagemc.net', 'CarnageMC Passwords'),
  ('passwords@notify.carnagemc.net', 'CarnageMC Passwords')
ON CONFLICT (email) DO UPDATE SET
  display_name = EXCLUDED.display_name;