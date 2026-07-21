ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'blood';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'blood_plus';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'chaos';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'chaos_plus';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'titan';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'immortal';
DELETE FROM public.user_roles WHERE role = 'donut_plus';