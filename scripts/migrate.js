#!/usr/bin/env node
import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const sql = `
  CREATE TABLE IF NOT EXISTS leaderboard (
    id         SERIAL PRIMARY KEY,
    username   TEXT    NOT NULL DEFAULT 'anonymous',
    score      INTEGER NOT NULL,
    game_mode  TEXT    NOT NULL DEFAULT 'classic',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
`;

try {
  await pool.query(sql);
  console.log('✅ leaderboard table ready');
} finally {
  await pool.end();
}
