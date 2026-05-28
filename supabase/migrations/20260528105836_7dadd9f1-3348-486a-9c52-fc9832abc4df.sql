-- Create helper function to check if a user is an admin
CREATE OR REPLACE FUNCTION public.is_admin_user(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'admin'
  )
$$;

-- Drop existing user write policies on mod_reviews
DROP POLICY IF EXISTS "Users can create own reviews" ON public.mod_reviews;
DROP POLICY IF EXISTS "Users can update own reviews" ON public.mod_reviews;
DROP POLICY IF EXISTS "Users can delete own reviews" ON public.mod_reviews;

-- Replace broad admin policy with explicit admin-only write policies
DROP POLICY IF EXISTS "Admins can manage all reviews" ON public.mod_reviews;

CREATE POLICY "Admins can insert reviews"
ON public.mod_reviews
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_user(auth.uid()));

CREATE POLICY "Admins can update reviews"
ON public.mod_reviews
FOR UPDATE
TO authenticated
USING (public.is_admin_user(auth.uid()))
WITH CHECK (public.is_admin_user(auth.uid()));

CREATE POLICY "Admins can delete reviews"
ON public.mod_reviews
FOR DELETE
TO authenticated
USING (public.is_admin_user(auth.uid()));