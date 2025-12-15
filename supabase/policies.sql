-- SECURITY POLICY UPDATE
-- Single Source of Truth: 'user_roles' table (confirmed via types).

-- 0. Enable RLS
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;

-- 1. USER_ROLES: allow users to read their own role
CREATE POLICY "users_read_own_role"
ON user_roles
FOR SELECT
USING ( auth.uid() = user_id );

-- 2. EVENTS POLICIES

-- Admins see own club's events
CREATE POLICY "club_admins_select_own_club_events"
ON events
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'club_admin'
      AND ur.club_id = events.club_id
  )
);

-- Admins insert events for their own club
CREATE POLICY "club_admins_insert_own_club_events"
ON events
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'club_admin'
      AND ur.club_id = events.club_id
  )
);

-- Admins update events for their own club
CREATE POLICY "club_admins_update_own_club_events"
ON events
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'club_admin'
      AND ur.club_id = events.club_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'club_admin'
      AND ur.club_id = events.club_id
  )
);

-- Public can view published events
CREATE POLICY "public_view_published_events"
ON events
FOR SELECT
USING (
  status = 'published'
);

-- 3. REGISTRATIONS POLICIES

-- Admin View: Admins can view registrations for their own club's events
CREATE POLICY "club_admins_view_club_registrations"
ON event_registrations
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM events e
    JOIN user_roles ur ON ur.club_id = e.club_id
    WHERE e.id = event_registrations.event_id
      AND ur.user_id = auth.uid()
      AND ur.role = 'club_admin'
  )
);

-- User Insert: Users can register themselves
-- Matches "user_id" column to auth.uid()
CREATE POLICY "users_insert_own_registration"
ON event_registrations
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
);

-- User View: Users can see their own registrations
CREATE POLICY "users_select_own_registrations"
ON event_registrations
FOR SELECT
USING (
  auth.uid() = user_id
);

-- User Delete: Users can cancel/delete their own registration
CREATE POLICY "users_delete_own_registration"
ON event_registrations
FOR DELETE
USING (
  auth.uid() = user_id
);


-- 4. STORAGE: 'event-banners' bucket

-- Public read of banners
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'event-banners' );

-- Club Admins upload to /{club_id}/...
CREATE POLICY "Club Admins Upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'event-banners'
  AND EXISTS (
    SELECT 1
    FROM user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'club_admin'
      AND (storage.foldername(name))[1] = ur.club_id::text
  )
);

-- Club Admins update their own files
CREATE POLICY "Club Admins Update"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'event-banners'
  AND EXISTS (
    SELECT 1
    FROM user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'club_admin'
      AND (storage.foldername(name))[1] = ur.club_id::text
  )
);

-- Club Admins delete their own files
CREATE POLICY "Club Admins Delete"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'event-banners'
  AND EXISTS (
    SELECT 1
    FROM user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'club_admin'
      AND (storage.foldername(name))[1] = ur.club_id::text
  )
);

-- ===========================================
-- 5. SUPER ADMIN POLICIES (Full Access)
-- ===========================================

-- Super admins can view ALL events (including drafts)
CREATE POLICY "super_admins_view_all_events"
ON events
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'super_admin'
  )
);

-- Super admins can insert events for ANY club
CREATE POLICY "super_admins_insert_any_event"
ON events
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'super_admin'
  )
);

-- Super admins can update ANY event
CREATE POLICY "super_admins_update_any_event"
ON events
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'super_admin'
  )
);

-- Super admins can delete ANY event
CREATE POLICY "super_admins_delete_any_event"
ON events
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'super_admin'
  )
);

-- Super admins can view ALL registrations
CREATE POLICY "super_admins_view_all_registrations"
ON event_registrations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'super_admin'
  )
);

-- Super admins have full storage access
CREATE POLICY "Super Admins Full Storage Access"
ON storage.objects FOR ALL
USING (
  bucket_id = 'event-banners'
  AND EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.role = 'super_admin'
  )
);
