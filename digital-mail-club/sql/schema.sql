- Digital Mail Club Database Schema
-- Create letters table
CREATE TABLE IF NOT EXISTS letters (
  id SERIAL PRIMARY KEY,
  code VARCHAR(6) UNIQUE NOT NULL,
  subject VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  sender_name VARCHAR(100) DEFAULT 'Anonymous Friend',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '30 days',
  read_count INTEGER DEFAULT 0,
  last_read_at TIMESTAMP WITH TIME ZONE
);

-- Create index on code for fast lookups
CREATE INDEX IF NOT EXISTS idx_letters_code ON letters(code);

-- Create index on expires_at for cleanup
CREATE INDEX IF NOT EXISTS idx_letters_expires ON letters(expires_at);

-- Create stats table for tracking usage
CREATE TABLE IF NOT EXISTS stats (
  id SERIAL PRIMARY KEY,
  metric VARCHAR(50) UNIQUE NOT NULL,
  value INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial stats
INSERT INTO stats (metric, value) VALUES ('total_letters', 0) ON CONFLICT (metric) DO NOTHING;
INSERT INTO stats (metric, value) VALUES ('total_reads', 0) ON CONFLICT (metric) DO NOTHING;