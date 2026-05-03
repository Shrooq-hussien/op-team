-- IEEE Menoufia SB Creative Arena - Database Schema
-- Cloudflare D1 (SQLite)

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  brief TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '🎮',
  accent TEXT NOT NULL DEFAULT 'from-cyan-400 via-blue-500 to-violet-600',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Members table
CREATE TABLE IF NOT EXISTS members (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Creative player',
  avatar_id TEXT NOT NULL,
  avatar_icon TEXT NOT NULL,
  avatar_name TEXT NOT NULL,
  avatar_trait TEXT NOT NULL,
  avatar_gradient TEXT NOT NULL,
  avatar_ring TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

-- Ideas table
CREATE TABLE IF NOT EXISTS ideas (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  member_id TEXT NOT NULL,
  title TEXT NOT NULL,
  thought TEXT NOT NULL,
  tags TEXT NOT NULL DEFAULT '[]',
  reactions TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_members_event_id ON members(event_id);
CREATE INDEX IF NOT EXISTS idx_ideas_event_id ON ideas(event_id);
CREATE INDEX IF NOT EXISTS idx_ideas_member_id ON ideas(member_id);
CREATE INDEX IF NOT EXISTS idx_members_points ON members(points DESC);
