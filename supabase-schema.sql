-- Secret Diary Database Schema for Supabase
-- Run this SQL in your Supabase SQL Editor

-- IMPORTANT: If tables already exist, run this command to safely add the username column!
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table (using camelCase for column names)
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  "passwordHash" TEXT NOT NULL,
  username TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Categories Table (using camelCase for column names)
CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE("userId", name)
);

-- Diaries Table (using camelCase for column names)
CREATE TABLE diaries (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  date TEXT NOT NULL,
  music TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  "coverStickers" JSONB DEFAULT '[]'::jsonb,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX "idx_diaries_userId" ON diaries("userId");
CREATE INDEX idx_diaries_category ON diaries(category);
CREATE INDEX idx_diaries_date ON diaries(date);
CREATE INDEX "idx_diaries_createdAt" ON diaries("createdAt" DESC);
CREATE INDEX "idx_categories_userId" ON categories("userId");

-- Function to update updatedAt timestamp
CREATE OR REPLACE FUNCTION "updateUpdatedAtColumn"()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for users table
CREATE TRIGGER "updateUsersUpdatedAt"
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION "updateUpdatedAtColumn"();

-- Trigger for diaries table
CREATE TRIGGER "updateDiariesUpdatedAt"
  BEFORE UPDATE ON diaries
  FOR EACH ROW
  EXECUTE FUNCTION "updateUpdatedAtColumn"();

-- Trigger for categories table
CREATE TRIGGER "updateCategoriesUpdatedAt"
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION "updateUpdatedAtColumn"();

-- Row Level Security (RLS) Policies
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE diaries ENABLE ROW LEVEL SECURITY;

-- Users policies (allow all operations for now, since we use JWT auth in API layer)
CREATE POLICY "Users can view their own data"
  ON users FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own data"
  ON users FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own data"
  ON users FOR UPDATE
  USING (true);

-- Categories policies
CREATE POLICY "Users can view their own categories"
  ON categories FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own categories"
  ON categories FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own categories"
  ON categories FOR UPDATE
  USING (true);

CREATE POLICY "Users can delete their own categories"
  ON categories FOR DELETE
  USING (true);

-- Diaries policies
CREATE POLICY "Users can view their own diaries"
  ON diaries FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own diaries"
  ON diaries FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own diaries"
  ON diaries FOR UPDATE
  USING (true);

CREATE POLICY "Users can delete their own diaries"
  ON diaries FOR DELETE
  USING (true);

-- Note: We're using permissive policies here because authentication
-- is handled at the API layer with JWT tokens. The API ensures users
-- can only access their own data.
