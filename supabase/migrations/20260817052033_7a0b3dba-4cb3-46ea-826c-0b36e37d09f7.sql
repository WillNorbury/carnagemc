DO $$
DECLARE t text; c text; cols text;
BEGIN
  FOREACH t IN ARRAY ARRAY['plugins','mods','user_servers','discover_items','organizations'] LOOP
    c := CASE WHEN t = 'organizations' THEN 'owner_id' ELSE 'user_id' END;
    SELECT string_agg(quote_ident(column_name), ', ')
      INTO cols
      FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = t AND column_name <> c;
    EXECUTE format('REVOKE SELECT ON public.%I FROM anon', t);
    EXECUTE format('GRANT SELECT (%s) ON public.%I TO anon', cols, t);
  END LOOP;
END $$;