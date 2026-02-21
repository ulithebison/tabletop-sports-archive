-- ================================================================
-- RLS Fix: Add `authenticated` role policies
-- Run this in: Supabase Dashboard → SQL Editor
-- Safe to re-run (uses IF NOT EXISTS-style naming; will error
-- harmlessly if policies already exist)
-- ================================================================

-- ----------------------------------------------------------------
-- game_submissions
-- ----------------------------------------------------------------

-- Let authenticated users insert (submit a game)
CREATE POLICY "submissions_authenticated_insert"
  ON game_submissions FOR INSERT TO authenticated
  WITH CHECK (status = 'pending');

-- Let authenticated users read all submissions (admin)
CREATE POLICY "submissions_authenticated_select"
  ON game_submissions FOR SELECT TO authenticated
  USING (true);

-- Let authenticated users update (admin approve/reject)
CREATE POLICY "submissions_authenticated_update"
  ON game_submissions FOR UPDATE TO authenticated
  USING (true);

-- ----------------------------------------------------------------
-- reviews
-- ----------------------------------------------------------------

-- Let authenticated users insert (submit a review)
CREATE POLICY "reviews_authenticated_insert"
  ON reviews FOR INSERT TO authenticated
  WITH CHECK (status = 'pending');

-- Let authenticated users read all reviews (admin sees pending too)
CREATE POLICY "reviews_authenticated_select"
  ON reviews FOR SELECT TO authenticated
  USING (true);

-- Let authenticated users update (admin approve/reject)
CREATE POLICY "reviews_authenticated_update"
  ON reviews FOR UPDATE TO authenticated
  USING (true);

-- ----------------------------------------------------------------
-- game_views
-- ----------------------------------------------------------------

-- Let authenticated users insert (view tracking)
CREATE POLICY "game_views_authenticated_insert"
  ON game_views FOR INSERT TO authenticated
  WITH CHECK (true);

-- Let authenticated users update (increment view count)
CREATE POLICY "game_views_authenticated_update"
  ON game_views FOR UPDATE TO authenticated
  USING (true);

-- ----------------------------------------------------------------
-- ratings
-- ----------------------------------------------------------------

-- Let authenticated users insert (submit a rating)
CREATE POLICY "ratings_authenticated_insert"
  ON ratings FOR INSERT TO authenticated
  WITH CHECK (true);

-- Let authenticated users update (change a rating)
CREATE POLICY "ratings_authenticated_update"
  ON ratings FOR UPDATE TO authenticated
  USING (true);

-- ----------------------------------------------------------------
-- comments
-- ----------------------------------------------------------------

-- Let authenticated users insert (post a comment)
CREATE POLICY "comments_authenticated_insert"
  ON comments FOR INSERT TO authenticated
  WITH CHECK (true);
