DROP TRIGGER IF EXISTS trg_changelog_entries_discord_notify ON public.changelog_entries;
DROP FUNCTION IF EXISTS public.changelog_entries_discord_notify();