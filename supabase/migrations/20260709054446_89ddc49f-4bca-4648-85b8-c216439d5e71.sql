-- Track whether a changelog entry has been posted to Discord
ALTER TABLE public.changelog_entries
  ADD COLUMN IF NOT EXISTS discord_posted_at TIMESTAMPTZ;

-- Trigger function: fire the edge function whenever an entry is published (insert or transition)
CREATE OR REPLACE FUNCTION public.changelog_entries_discord_notify()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  should_post BOOLEAN := FALSE;
  service_key TEXT;
BEGIN
  IF TG_OP = 'INSERT' AND NEW.published = TRUE AND NEW.discord_posted_at IS NULL THEN
    should_post := TRUE;
  ELSIF TG_OP = 'UPDATE'
     AND NEW.published = TRUE
     AND (OLD.published IS DISTINCT FROM NEW.published)
     AND NEW.discord_posted_at IS NULL THEN
    should_post := TRUE;
  END IF;

  IF NOT should_post THEN
    RETURN NEW;
  END IF;

  BEGIN
    SELECT decrypted_secret INTO service_key
    FROM vault.decrypted_secrets
    WHERE name = 'email_queue_service_role_key'
    LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    service_key := NULL;
  END;

  BEGIN
    PERFORM net.http_post(
      url := 'https://xedqdxjorneezfnpyogg.supabase.co/functions/v1/changelog-discord-post',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || COALESCE(service_key, '')
      ),
      body := jsonb_build_object('entryId', NEW.id)
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'changelog_entries_discord_notify http_post failed: %', SQLERRM;
  END;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_changelog_entries_discord_notify ON public.changelog_entries;
CREATE TRIGGER trg_changelog_entries_discord_notify
AFTER INSERT OR UPDATE OF published ON public.changelog_entries
FOR EACH ROW EXECUTE FUNCTION public.changelog_entries_discord_notify();
