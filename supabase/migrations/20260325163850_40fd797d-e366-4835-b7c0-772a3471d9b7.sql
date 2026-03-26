-- Remove the blanket deny for anon
DROP POLICY "product_review_waitlist_deny_anon" ON product_review_waitlist;

-- Anon can't read waitlist data
CREATE POLICY "product_review_waitlist_deny_anon_select"
  ON product_review_waitlist FOR SELECT TO anon USING (false);

-- Anon can insert into waitlist (user_id must be NULL for anon)
CREATE POLICY "product_review_waitlist_insert_anon"
  ON product_review_waitlist FOR INSERT TO anon
  WITH CHECK (user_id IS NULL);