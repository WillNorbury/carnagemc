CREATE TABLE public.litebans_mysql_config (
  id boolean PRIMARY KEY DEFAULT true,
  host text NOT NULL,
  port integer NOT NULL DEFAULT 3306,
  database text NOT NULL,
  username text NOT NULL,
  password text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid,
  CONSTRAINT litebans_mysql_config_singleton CHECK (id = true)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.litebans_mysql_config TO authenticated;
GRANT ALL ON public.litebans_mysql_config TO service_role;

ALTER TABLE public.litebans_mysql_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view litebans mysql config"
ON public.litebans_mysql_config FOR SELECT
TO authenticated
USING (private.has_role(auth.uid(), 'owner'::public.app_role));

CREATE POLICY "Owners can insert litebans mysql config"
ON public.litebans_mysql_config FOR INSERT
TO authenticated
WITH CHECK (private.has_role(auth.uid(), 'owner'::public.app_role));

CREATE POLICY "Owners can update litebans mysql config"
ON public.litebans_mysql_config FOR UPDATE
TO authenticated
USING (private.has_role(auth.uid(), 'owner'::public.app_role))
WITH CHECK (private.has_role(auth.uid(), 'owner'::public.app_role));

INSERT INTO public.litebans_mysql_config (id, host, port, database, username, password)
VALUES (true, '198.96.92.19', 3306, 's200_litebans', 'u200_PflhMoa5Na', 'LEFt5j1KWQrd2=e@g79nMhAZ')
ON CONFLICT (id) DO NOTHING;