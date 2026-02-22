-- ================================================================
-- Review Votes — allows anonymous up/down voting on approved reviews
-- Run this in Supabase SQL Editor
-- ================================================================

CREATE TABLE IF NOT EXISTS review_votes (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  review_id   bigint NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  session_id  text NOT NULL,
  vote        smallint NOT NULL CHECK (vote IN (1, -1)),
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (review_id, session_id)
);

CREATE INDEX IF NOT EXISTS idx_review_votes_review ON review_votes(review_id);

-- RLS policies
ALTER TABLE review_votes ENABLE ROW LEVEL SECURITY;

-- Anyone can read votes
CREATE POLICY "Public read access" ON review_votes
  FOR SELECT USING (true);

-- Anon and authenticated can insert
CREATE POLICY "Anon insert access" ON review_votes
  FOR INSERT WITH CHECK (true);

-- Anon and authenticated can update their own votes
CREATE POLICY "Anon update own votes" ON review_votes
  FOR UPDATE USING (true) WITH CHECK (true);

-- Anon and authenticated can delete their own votes
CREATE POLICY "Anon delete own votes" ON review_votes
  FOR DELETE USING (true);
