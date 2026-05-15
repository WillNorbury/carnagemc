CREATE TABLE public.rule_sections (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  icon text NOT NULL DEFAULT 'ShieldCheck',
  title text NOT NULL,
  items text[] NOT NULL DEFAULT '{}',
  sort_order integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.rule_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Rule sections published public read"
ON public.rule_sections FOR SELECT
TO public
USING (published);

CREATE POLICY "Admins view all rule sections"
ON public.rule_sections FOR SELECT
TO authenticated
USING (private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage rule sections"
ON public.rule_sections FOR ALL
TO authenticated
USING (private.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER rule_sections_set_updated_at
BEFORE UPDATE ON public.rule_sections
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.rule_sections (icon, title, items, sort_order) VALUES
('ShieldCheck', 'General Rules', ARRAY[
  'Be respectful to all players and staff members.',
  'No harassment, bullying, or toxic behavior.',
  'English only in main chat channels.',
  'No advertising other servers or services.',
  'Follow staff instructions at all times.'
], 10),
('MessageSquare', 'Chat Rules', ARRAY[
  'No spamming or excessive caps.',
  'No inappropriate or offensive language.',
  'No sharing personal information.',
  'No begging for items, ranks, or staff positions.',
  'Keep discussions family-friendly.'
], 20),
('Swords', 'Gameplay Rules', ARRAY[
  'No hacking, cheating, or exploiting bugs.',
  'No using unauthorized mods or clients.',
  'No griefing or destroying others'' builds.',
  'No scamming or stealing from other players.',
  'No spawn killing or excessive camping.'
], 30),
('Users', 'Community Rules', ARRAY[
  'Report rule breakers to staff, don''t retaliate.',
  'No impersonating staff or other players.',
  'Respect player privacy and boundaries.',
  'Help create a welcoming environment.',
  'Have fun and enjoy the server!'
], 40),
('Gavel', 'Punishment System', ARRAY[
  '1st Offense → Warning',
  '2nd Offense → 1 Hour Mute',
  '3rd Offense → 1 Day Ban',
  '4th Offense → 7 Day Ban',
  'Severe Offense → Permanent Ban'
], 50);