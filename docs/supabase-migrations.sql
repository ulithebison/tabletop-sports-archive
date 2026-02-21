-- ================================================================
-- Tabletop Sports Games Archive — Supabase SQL Migrations
-- Run these in: Supabase Dashboard → SQL Editor
-- ================================================================

-- ----------------------------------------------------------------
-- 1. GAME VIEWS — track page view counts
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS game_views (
  game_id   integer PRIMARY KEY REFERENCES games(id) ON DELETE CASCADE,
  view_count integer NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_game_views_count ON game_views (view_count DESC);

-- RLS: public can read, service role can write
ALTER TABLE game_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "game_views_public_read"
  ON game_views FOR SELECT
  TO public USING (true);

CREATE POLICY "game_views_service_write"
  ON game_views FOR ALL
  TO service_role USING (true);

-- Allow anon to insert/update (for view tracking)
CREATE POLICY "game_views_anon_upsert"
  ON game_views FOR INSERT
  TO anon WITH CHECK (true);

CREATE POLICY "game_views_anon_update"
  ON game_views FOR UPDATE
  TO anon USING (true);

-- Allow authenticated to insert/update (view tracking when logged in)
CREATE POLICY "game_views_authenticated_insert"
  ON game_views FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "game_views_authenticated_update"
  ON game_views FOR UPDATE TO authenticated
  USING (true);

-- ----------------------------------------------------------------
-- 2. RATINGS — anonymous community star ratings (1–5)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ratings (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  game_id     integer NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  session_id  text    NOT NULL,
  stars       smallint NOT NULL CHECK (stars BETWEEN 1 AND 5),
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (game_id, session_id)
);

CREATE INDEX IF NOT EXISTS idx_ratings_game_id ON ratings (game_id);

ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ratings_public_read"
  ON ratings FOR SELECT TO public USING (true);

CREATE POLICY "ratings_anon_insert"
  ON ratings FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "ratings_anon_update"
  ON ratings FOR UPDATE TO anon USING (true);

-- Allow authenticated to insert/update (ratings when logged in)
CREATE POLICY "ratings_authenticated_insert"
  ON ratings FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "ratings_authenticated_update"
  ON ratings FOR UPDATE TO authenticated
  USING (true);

-- ----------------------------------------------------------------
-- 3. REVIEWS — community reviews (moderated)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reviews (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  game_id    integer NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  author     text    NOT NULL,
  email      text,
  body       text    NOT NULL,
  stars      smallint CHECK (stars BETWEEN 1 AND 5),
  status     text    NOT NULL DEFAULT 'pending'
             CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reviews_game_id_status ON reviews (game_id, status);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews (status);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Public can read approved reviews
CREATE POLICY "reviews_public_read_approved"
  ON reviews FOR SELECT TO public
  USING (status = 'approved');

-- Anon can insert (submit new review)
CREATE POLICY "reviews_anon_insert"
  ON reviews FOR INSERT TO anon
  WITH CHECK (status = 'pending');

-- Service role (admin) can do everything
CREATE POLICY "reviews_service_all"
  ON reviews FOR ALL TO service_role USING (true);

-- Allow authenticated users to insert reviews
CREATE POLICY "reviews_authenticated_insert"
  ON reviews FOR INSERT TO authenticated
  WITH CHECK (status = 'pending');

-- Allow authenticated users to read all reviews (admin sees pending)
CREATE POLICY "reviews_authenticated_select"
  ON reviews FOR SELECT TO authenticated
  USING (true);

-- Allow authenticated users to update reviews (admin approve/reject)
CREATE POLICY "reviews_authenticated_update"
  ON reviews FOR UPDATE TO authenticated
  USING (true);

-- ----------------------------------------------------------------
-- 4. GAME SUBMISSIONS — user-submitted games awaiting moderation
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS game_submissions (
  id                bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name              text NOT NULL,
  subtitle          text,
  sport             text,
  year              integer,
  type              text,
  description       text,
  players           text,
  playtime          text,
  complexity        text,
  publisher_name    text,
  publisher_website text,
  bgg_url           text,
  image_url         text,
  submitter_name    text,
  submitter_email   text,
  status            text NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_submissions_status ON game_submissions (status);

ALTER TABLE game_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "submissions_anon_insert"
  ON game_submissions FOR INSERT TO anon
  WITH CHECK (status = 'pending');

CREATE POLICY "submissions_service_all"
  ON game_submissions FOR ALL TO service_role USING (true);

-- Allow authenticated users to insert submissions
CREATE POLICY "submissions_authenticated_insert"
  ON game_submissions FOR INSERT TO authenticated
  WITH CHECK (status = 'pending');

-- Allow authenticated users to read all submissions (admin)
CREATE POLICY "submissions_authenticated_select"
  ON game_submissions FOR SELECT TO authenticated
  USING (true);

-- Allow authenticated users to update submissions (admin approve/reject)
CREATE POLICY "submissions_authenticated_update"
  ON game_submissions FOR UPDATE TO authenticated
  USING (true);

-- ----------------------------------------------------------------
-- 5. COMMENTS — public discussion on game pages
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS comments (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  game_id    integer NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  author     text    NOT NULL,
  body       text    NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comments_game_id ON comments (game_id);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comments_public_read"
  ON comments FOR SELECT TO public USING (true);

CREATE POLICY "comments_anon_insert"
  ON comments FOR INSERT TO anon WITH CHECK (true);

-- Allow authenticated users to insert comments
CREATE POLICY "comments_authenticated_insert"
  ON comments FOR INSERT TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to read all comments (admin)
CREATE POLICY "comments_authenticated_select"
  ON comments FOR SELECT TO authenticated
  USING (true);

-- Allow authenticated users to delete comments (admin moderation)
CREATE POLICY "comments_authenticated_delete"
  ON comments FOR DELETE TO authenticated
  USING (true);

-- ----------------------------------------------------------------
-- 6. NEWS — landing page announcements
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS news (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title      text NOT NULL,
  body       text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE news ENABLE ROW LEVEL SECURITY;

CREATE POLICY "news_public_read"
  ON news FOR SELECT TO public USING (true);

CREATE POLICY "news_service_all"
  ON news FOR ALL TO service_role USING (true);

-- Allow authenticated users to read all news (admin)
CREATE POLICY "news_authenticated_select"
  ON news FOR SELECT TO authenticated
  USING (true);

-- Allow authenticated users to insert news (admin)
CREATE POLICY "news_authenticated_insert"
  ON news FOR INSERT TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update news (admin)
CREATE POLICY "news_authenticated_update"
  ON news FOR UPDATE TO authenticated
  USING (true);

-- Allow authenticated users to delete news (admin)
CREATE POLICY "news_authenticated_delete"
  ON news FOR DELETE TO authenticated
  USING (true);

-- ----------------------------------------------------------------
-- 7. INDEXES on games table for filter performance
-- ----------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_games_sport       ON games (sport);
CREATE INDEX IF NOT EXISTS idx_games_type        ON games (type);
CREATE INDEX IF NOT EXISTS idx_games_year        ON games (year);
CREATE INDEX IF NOT EXISTS idx_games_complexity  ON games (complexity);
CREATE INDEX IF NOT EXISTS idx_games_source      ON games (source);
CREATE INDEX IF NOT EXISTS idx_games_name        ON games (name);
CREATE INDEX IF NOT EXISTS idx_games_created_at  ON games (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_games_rating      ON games (average_rating DESC NULLS LAST);

-- ----------------------------------------------------------------
-- 8. Admin user setup
-- Note: Create via Supabase Dashboard → Authentication → Users
-- Then set admin email in your .env or check user metadata
-- ----------------------------------------------------------------
-- (Manual step: go to Auth → Users → Invite user with your admin email)

-- Optional: seed a test news item
INSERT INTO news (title, body) VALUES
  (
    'Welcome to the Tabletop Sports Games Archive!',
    'We have catalogued over 6,800 physical sports simulation games. Browse by sport, game type, or search for your favorite. New games added regularly!'
  )
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------
-- 9. VIEW — games_with_views (games + view count for sorting)
-- ----------------------------------------------------------------
CREATE OR REPLACE VIEW games_with_views AS
SELECT g.*, COALESCE(gv.view_count, 0) AS total_views
FROM games g
LEFT JOIN game_views gv ON g.id = gv.game_id;

-- ----------------------------------------------------------------
-- 10. RLS policies on games table — allow authenticated insert
-- ----------------------------------------------------------------
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

CREATE POLICY "games_public_read"
  ON games FOR SELECT TO public USING (true);

CREATE POLICY "games_authenticated_insert"
  ON games FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "games_authenticated_update"
  ON games FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "games_authenticated_delete"
  ON games FOR DELETE TO authenticated
  USING (true);

-- ----------------------------------------------------------------
-- 11. approved_game_id column on game_submissions — links to games
-- ----------------------------------------------------------------
ALTER TABLE game_submissions
  ADD COLUMN IF NOT EXISTS approved_game_id integer REFERENCES games(id) ON DELETE SET NULL;
