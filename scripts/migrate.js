#!/usr/bin/env node
import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

try {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS leaderboard (
      id           SERIAL PRIMARY KEY,
      username     TEXT    NOT NULL DEFAULT 'anonymous',
      score        INTEGER NOT NULL,
      game_mode    TEXT    NOT NULL DEFAULT 'classic',
      created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await pool.query(`
    ALTER TABLE leaderboard ADD COLUMN IF NOT EXISTS session_data JSONB;
  `);
  await pool.query(`
    ALTER TABLE leaderboard ADD COLUMN IF NOT EXISTS game_date DATE NOT NULL DEFAULT CURRENT_DATE;
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS leaderboard_game_date_idx ON leaderboard (game_date);
  `);
  // Remove pre-existing duplicate daily ('clear') entries, keeping the most recent per
  // (username, game_date), so the unique index below can be created.
  await pool.query(`
    DELETE FROM leaderboard a USING leaderboard b
    WHERE a.game_mode = 'clear' AND b.game_mode = 'clear'
      AND a.username = b.username AND a.game_date = b.game_date
      AND a.id < b.id;
  `);
  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS leaderboard_daily_unique_idx
      ON leaderboard (username, game_date)
      WHERE game_mode = 'clear';
  `);
  console.log('✅ leaderboard table ready');
  await pool.query(`
    CREATE TABLE IF NOT EXISTS word_history (
      id            SERIAL PRIMARY KEY,
      username      TEXT    NOT NULL,
      word          TEXT    NOT NULL,
      times_made    INTEGER NOT NULL DEFAULT 1,
      first_made_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_made_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (username, word)
    );
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS word_history_username_idx ON word_history (username);
  `);
  console.log('✅ word_history table ready');
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      username   TEXT PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  await pool.query(`
    INSERT INTO users (username) VALUES ('yiding'), ('hannah')
    ON CONFLICT DO NOTHING;
  `);
  console.log('✅ users table ready');
  await pool.query(`
    CREATE TABLE IF NOT EXISTS active_sessions (
      username    TEXT PRIMARY KEY,
      game_type   TEXT,
      snapshot    JSONB NOT NULL,
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  console.log('✅ active_sessions table ready');
} finally {
  await pool.end();
}
