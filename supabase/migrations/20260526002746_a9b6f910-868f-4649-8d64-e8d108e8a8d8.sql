CREATE OR REPLACE FUNCTION public.check_is_admin_logged(_context text DEFAULT NULL::text, _user_agent text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  uid uuid := auth.uid();
  is_a boolean := false;
  found_roles text[];
  user_email text;
begin
  if uid is not null then
    select array_agg(role::text) into found_roles from public.user_roles where user_id = uid;
    is_a := private.has_role(uid, 'admin'::app_role) OR private.has_role(uid, 'owner'::app_role);
    select email into user_email from auth.users where id = uid;
  end if;

  insert into public.admin_check_logs (user_id, email, is_admin, roles_found, context, user_agent)
  values (uid, user_email, coalesce(is_a, false), found_roles, _context, _user_agent);

  return coalesce(is_a, false);
end;
$function$;