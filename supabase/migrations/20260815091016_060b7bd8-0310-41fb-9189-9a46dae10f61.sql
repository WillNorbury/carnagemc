update public.site_content
set value = jsonb_set(jsonb_set(jsonb_set(value::jsonb, '{ip}', '"play.carnagemc.net"'), '{bedrockIp}', '"play.carnagemc.net"'), '{version}', '"1.21.x Paper"')
where key = 'server';

delete from public.reviews where id = 'dedbb523-1a91-4201-be13-920d74d26903';