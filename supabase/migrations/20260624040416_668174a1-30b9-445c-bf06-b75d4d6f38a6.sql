
CREATE OR REPLACE FUNCTION public.notify_new_user_report()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  admin_id UUID;
  label TEXT := COALESCE(NEW.target_label, NEW.target_id, NEW.target_type);
BEGIN
  FOR admin_id IN
    SELECT user_id FROM public.user_roles WHERE role IN ('admin'::app_role, 'owner'::app_role)
  LOOP
    INSERT INTO public.notifications (user_id, kind, title, body, link)
    VALUES (
      admin_id,
      'report_new',
      'New report submitted',
      'Report on ' || NEW.target_type || ': ' || label || ' — ' || NEW.reason,
      '/admin?tab=reports'
    );
  END LOOP;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS user_reports_notify_admins ON public.user_reports;
CREATE TRIGGER user_reports_notify_admins
AFTER INSERT ON public.user_reports
FOR EACH ROW EXECUTE FUNCTION public.notify_new_user_report();
