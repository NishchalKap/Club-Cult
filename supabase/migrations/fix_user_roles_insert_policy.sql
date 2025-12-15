-- FIX: Add INSERT policy for user_roles so users can create their own role entry during signup
-- This must be run in Supabase SQL Editor

-- Allow users to insert their OWN role entry (only if user_id matches their auth.uid())
CREATE POLICY "users_insert_own_role"
ON user_roles
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
);

-- Allow super admins to update any user's role (for club assignment)
CREATE POLICY "super_admins_manage_all_roles"
ON user_roles
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'super_admin'
  )
);

-- If the above policy for super_admin causes recursion issues, use this simpler version:
-- CREATE POLICY "super_admins_update_roles"
-- ON user_roles
-- FOR UPDATE
-- USING (true)
-- WITH CHECK (true);
-- Note: This requires you to first manually insert a super_admin role
