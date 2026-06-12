-- Ban Appeals
CREATE TABLE public.ban_appeals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE SET NULL,
  minecraft_username TEXT NOT NULL,
  discord_tag TEXT,
  email TEXT,
  ban_reason TEXT,
  appeal_text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_response TEXT,
  reviewed_by UUID REFERENCES auth.users ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ban_appeals TO authenticated;
GRANT INSERT ON public.ban_appeals TO anon;
GRANT ALL ON public.ban_appeals TO service_role;
ALTER TABLE public.ban_appeals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can submit appeal" ON public.ban_appeals FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "user can view own appeal" ON public.ban_appeals FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "admins manage appeals" ON public.ban_appeals FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'owner'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'owner'::app_role));
CREATE TRIGGER ban_appeals_updated BEFORE UPDATE ON public.ban_appeals FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Wiki
CREATE TABLE public.wiki_articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  category TEXT,
  excerpt TEXT,
  content TEXT NOT NULL DEFAULT '',
  published BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  author_id UUID REFERENCES auth.users ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.wiki_articles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wiki_articles TO authenticated;
GRANT ALL ON public.wiki_articles TO service_role;
ALTER TABLE public.wiki_articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read published wiki" ON public.wiki_articles FOR SELECT TO anon, authenticated USING (published OR private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'owner'::app_role));
CREATE POLICY "admins manage wiki" ON public.wiki_articles FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'owner'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'owner'::app_role));
CREATE TRIGGER wiki_articles_updated BEFORE UPDATE ON public.wiki_articles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Gallery
CREATE TABLE public.gallery_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT,
  caption TEXT,
  image_url TEXT NOT NULL,
  category TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.gallery_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.gallery_items TO authenticated;
GRANT ALL ON public.gallery_items TO service_role;
ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read published gallery" ON public.gallery_items FOR SELECT TO anon, authenticated USING (published OR private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'owner'::app_role));
CREATE POLICY "admins manage gallery" ON public.gallery_items FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'owner'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'owner'::app_role));
CREATE TRIGGER gallery_items_updated BEFORE UPDATE ON public.gallery_items FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Contact methods
CREATE TABLE public.contact_methods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  label TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'link',
  value TEXT NOT NULL,
  icon TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.contact_methods TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contact_methods TO authenticated;
GRANT ALL ON public.contact_methods TO service_role;
ALTER TABLE public.contact_methods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read published contact" ON public.contact_methods FOR SELECT TO anon, authenticated USING (published OR private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'owner'::app_role));
CREATE POLICY "admins manage contact" ON public.contact_methods FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'owner'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'owner'::app_role));
CREATE TRIGGER contact_methods_updated BEFORE UPDATE ON public.contact_methods FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Contact messages
CREATE TABLE public.contact_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  handled BOOLEAN NOT NULL DEFAULT false,
  handled_by UUID REFERENCES auth.users ON DELETE SET NULL,
  handled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.contact_messages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contact_messages TO authenticated;
GRANT ALL ON public.contact_messages TO service_role;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can send message" ON public.contact_messages FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "admins read/update messages" ON public.contact_messages FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'owner'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role) OR private.has_role(auth.uid(), 'owner'::app_role));
CREATE TRIGGER contact_messages_updated BEFORE UPDATE ON public.contact_messages FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();