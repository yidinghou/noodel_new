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
} finally {
  await pool.end();
}
