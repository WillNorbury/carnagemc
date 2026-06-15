
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_user_created ON public.notifications(user_id, created_at DESC);
GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own notifications" ON public.notifications
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins insert notifications" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.notify_ban_appeal_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_id UUID;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Notify all admins of a new appeal
    FOR admin_id IN
      SELECT user_id FROM public.user_roles WHERE role = 'admin'::app_role
    LOOP
      INSERT INTO public.notifications (user_id, kind, title, body, link)
      VALUES (
        admin_id,
        'ban_appeal_new',
        'New ban appeal',
        NEW.minecraft_username || ' submitted an appeal',
        '/admin?tab=appeals'
      );
    END LOOP;
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.user_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, kind, title, body, link)
      VALUES (
        NEW.user_id,
        'ban_appeal_status',
        'Your appeal was ' || NEW.status,
        COALESCE(NEW.admin_response, 'Staff updated your appeal status.'),
        '/appeal'
      );
    END IF;
    RETURN NEW;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ban_appeal_notify ON public.ban_appeals;
CREATE TRIGGER trg_ban_appeal_notify
AFTER INSERT OR UPDATE ON public.ban_appeals
FOR EACH ROW EXECUTE FUNCTION public.notify_ban_appeal_event();
