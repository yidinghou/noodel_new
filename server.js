
import 'dotenv/config';
import express from 'express';
import expressStaticGzip from 'express-static-gzip';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import pg from 'pg';

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const DIST = path.join(__dirname, 'dist');

app.use(express.json({ limit: '2mb' }));

// Serve compressed assets from dist/
app.use('/', expressStaticGzip(DIST, {
  enableBrotli: true,
  customCompressions: [{
    encodingName: 'deflate',
    fileExtension: 'zz'
  }],
  orderPreference: ['br', 'gzip']
}));

app.use(express.static(DIST, {
  maxAge: '1d',
  etag: true
}));

// Leaderboard API
app.post('/api/scores', async (req, res) => {
  const { score, gameMode, username, sessionData } = req.body;
  if (typeof score !== 'number') return res.status(400).json({ error: 'score required' });
  const result = await pool.query(
    'INSERT INTO leaderboard (score, game_mode, username, session_data) VALUES ($1, $2, $3, $4) RETURNING id, username, score, game_mode, created_at',
    [score, gameMode || 'classic', username || 'anonymous', sessionData ? JSON.stringify(sessionData) : null]
  );
  res.status(201).json(result.rows[0]);
});

app.get('/api/scores', async (req, res) => {
  const result = await pool.query(
    'SELECT id, username, score, game_mode, created_at FROM leaderboard ORDER BY score DESC LIMIT 20'
  );
  res.json(result.rows);
});

app.get('/api/scores/:id/session', async (req, res) => {
  const { id } = req.params;
  const result = await pool.query(
    'SELECT session_data FROM leaderboard WHERE id = $1',
    [id]
  );
  if (!result.rows.length || !result.rows[0].session_data) {
    return res.status(404).json({ error: 'session not found' });
  }
  res.json(result.rows[0].session_data);
});

// Serve known HTML entry points directly; fall back to index.html for SPA routes
const HTML_ENTRIES = ['index.html', 'poc.html'];
app.get('*', (req, res) => {
  const requested = path.basename(req.path);
  const file = HTML_ENTRIES.includes(requested) ? requested : 'index.html';
  res.sendFile(path.join(DIST, file));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🎮 NOODEL Word Game server running on port ${PORT}`);
  console.log(`🌐 Access at: http://localhost:${PORT}`);
});
