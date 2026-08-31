CREATE TABLE public.tab_animations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  change_interval integer NOT NULL DEFAULT 2500,
  lines jsonb NOT NULL DEFAULT '[]'::jsonb,
  sort_order integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.tab_animations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tab_animations TO authenticated;
GRANT ALL ON public.tab_animations TO service_role;

ALTER TABLE public.tab_animations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published tab animations"
ON public.tab_animations FOR SELECT TO anon, authenticated
USING (published = true);

CREATE POLICY "Admins can view all tab animations"
ON public.tab_animations FOR SELECT TO authenticated
USING (private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'owner'::app_role));

CREATE POLICY "Admins can manage tab animations"
ON public.tab_animations FOR ALL TO authenticated
USING (private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'owner'::app_role))
WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'owner'::app_role));

INSERT INTO public.tab_animations (name, change_interval, lines, sort_order, published) VALUES
('Links', 2500, '["<#00748c>&lDISCORD &8• &fdiscord.warden.rip", "<#006371>&lWEBSITE &8• &fwarden.rip"]'::jsonb, 0, true),
('1', 2500, '["<#00748c>Discord &8• &7Website", "&7Discord &8• <#006371>Website"]'::jsonb, 1, true);