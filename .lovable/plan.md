

## Plan: Admin Section for Exclusive Sessions Management

### What we're building
A new admin page at `/admin/sesiones` to view all exclusive sessions, see who reserved spots, and manage capacity. This follows the same patterns as existing admin pages (AdminDescargables, AdminCourses, etc.).

### Steps

1. **Create `AdminSessions.tsx` page** (`src/pages/admin/AdminSessions.tsx`)
   - List all sessions from `exclusive_sessions` table (active and inactive)
   - For each session, show: title, slug, date, spots taken / max_spots, status (active/inactive)
   - Expandable row or dialog to see the list of reservations (user name, email, reserved_at) by joining `session_reservations` with `profiles`
   - Ability to toggle `is_active` on a session
   - Ability to edit `max_spots` inline or via dialog
   - Button to create a new session (title, slug, description, date, max_spots)
   - Button to delete a reservation (remove a user from the list)

2. **Add route in `App.tsx`**
   - Lazy import `AdminSessions`
   - Add `<Route path="sesiones" element={<AdminSessions />} />` inside the admin routes

3. **Add sidebar nav item in `AdminSidebar.tsx`**
   - Add "Sesiones" entry with `Calendar` icon pointing to `/admin/sesiones`, placed after "Blog"

### Technical details
- Queries use Supabase client directly with `useQuery` (same pattern as AdminDescargables)
- Reservations query joins `session_reservations` with `profiles` to show user info
- No new RLS policies needed: admin already has full access via existing `is_admin()` policies on both tables
- No migrations needed: all tables and columns already exist

