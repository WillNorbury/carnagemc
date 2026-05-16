UPDATE public.site_content
SET value = jsonb_set(value, '{discord}', '"https://discord.xylomc.net"'::jsonb)
WHERE key = 'server';

UPDATE public.site_content
SET value = jsonb_set(value, '{welcomeMessage}', '"Welcome to XyloMC, {user}!"'::jsonb)
WHERE key = 'discord_bot';