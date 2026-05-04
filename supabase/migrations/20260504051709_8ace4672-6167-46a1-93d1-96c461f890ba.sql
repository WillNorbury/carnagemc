
-- Add new role values to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'owner';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'developer';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'sr_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'jr_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'sr_mod';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'mod';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'sr_helper';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'helper';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'champion';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'media';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'elite';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'mvp';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'vip';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'booster';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'default';
