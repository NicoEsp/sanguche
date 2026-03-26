

## Problem

Currently, non-logged-in users cannot join the Productastic Review waitlist because:
1. **Code blocks it**: Line 48-51 shows a toast saying "Necesitás estar logueado" if no user session exists
2. **RLS blocks it**: The `product_review_waitlist_insert_own` policy requires `user_id = get_profile_id_for_auth()`, and anonymous users are explicitly denied by `product_review_waitlist_deny_anon`
3. **The `user_id` column** is nullable (good), but no policy allows anonymous inserts

## Plan

### 1. Database migration: Allow anonymous inserts

- Add a new RLS policy `product_review_waitlist_insert_anon` for `anon` role on INSERT, with `WITH CHECK (true)` so unauthenticated users can insert rows (with `user_id` as NULL)
- Modify the existing `product_review_waitlist_deny_anon` policy to only deny SELECT (not ALL), so anon users can insert but not read

Specifically:
```sql
-- Remove the blanket deny for anon
DROP POLICY "product_review_waitlist_deny_anon" ON product_review_waitlist;

-- Anon can't read waitlist data
CREATE POLICY "product_review_waitlist_deny_anon_select"
  ON product_review_waitlist FOR SELECT TO anon USING (false);

-- Anon can insert into waitlist (user_id will be NULL)
CREATE POLICY "product_review_waitlist_insert_anon"
  ON product_review_waitlist FOR INSERT TO anon
  WITH CHECK (user_id IS NULL);
```

### 2. Update ProductReviewModal.tsx

- Remove the `if (!user)` block that blocks submission
- Remove the `if (!profile?.id)` block
- When inserting, pass `user_id: profile?.id ?? null` so logged-in users get linked and anonymous users insert with NULL
- Keep the `useAuth` and `useUserProfile` hooks but make them optional for the flow

The key change in `handleSubmit`:
```typescript
// No longer block non-logged-in users
const { error } = await supabase
  .from("product_review_waitlist")
  .insert({ email: result.data, user_id: profile?.id ?? null });
```

### Files changed
- **Migration**: New SQL migration for RLS policy updates
- **`src/components/planes/ProductReviewModal.tsx`**: Remove auth gates, pass nullable user_id

