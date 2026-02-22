-- ================================================================
-- Blog Posts table
-- Run this in Supabase SQL Editor
-- ================================================================

CREATE TABLE IF NOT EXISTS blog_posts (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title         text NOT NULL,
  slug          text NOT NULL UNIQUE,
  body          text NOT NULL,
  excerpt       text,
  image_url     text,
  status        text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  published_at  timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Row Level Security
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Anyone can read published posts
CREATE POLICY "Public read published" ON blog_posts
  FOR SELECT USING (status = 'published');

-- Authenticated users (admin) can do everything
CREATE POLICY "Auth manage" ON blog_posts
  FOR ALL USING (auth.role() = 'authenticated');

-- Service role has full access
CREATE POLICY "Service full" ON blog_posts
  FOR ALL USING (auth.role() = 'service_role');
