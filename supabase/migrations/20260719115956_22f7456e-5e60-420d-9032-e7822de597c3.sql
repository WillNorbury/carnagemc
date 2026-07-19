DROP POLICY IF EXISTS "Site content public read" ON public.site_content;
CREATE POLICY "Site content public read"
ON public.site_content
FOR SELECT
USING (key = ANY (ARRAY['hero','alerts','event','popup','server','status_page','discord_embeds']));