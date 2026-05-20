
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
  const { score, gameMode, username, sessionData, wordsCleared } = req.body;
  if (typeof score !== 'number') return res.status(400).json({ error: 'score required' });
  const user = username || 'anonymous';
  const result = await pool.query(
    'INSERT INTO leaderboard (score, game_mode, username, session_data) VALUES ($1, $2, $3, $4) RETURNING id, username, score, game_mode, created_at',
    [score, gameMode || 'classic', user, sessionData ? JSON.stringify(sessionData) : null]
  );

  let wordStats = null;
  const words = Array.isArray(wordsCleared) && wordsCleared.length > 0 ? wordsCleared : null;
  if (words) {
    await pool.query(
      `INSERT INTO word_history (username, word, times_made, first_made_at, last_made_at)
       SELECT $1, unnest($2::text[]), 1, NOW(), NOW()
       ON CONFLICT (username, word) DO UPDATE
         SET times_made = word_history.times_made + 1,
             last_made_at = NOW()`,
      [user, words]
    );
    const [sizeResult, rarestResult, worldFirstsResult] = await Promise.all([
      pool.query('SELECT COUNT(*)::int AS count FROM word_history WHERE username = $1', [user]),
      pool.query(
        'SELECT word, times_made FROM word_history WHERE username = $1 AND word = ANY($2::text[]) ORDER BY times_made ASC LIMIT 1',
        [user, words]
      ),
      pool.query(
        'SELECT word FROM word_history WHERE word = ANY($1::text[]) GROUP BY word HAVING COUNT(DISTINCT username) = 1',
        [words]
      ),
    ]);
    wordStats = {
      vocabularySize: sizeResult.rows[0].count,
      rarestWord: rarestResult.rows[0]
        ? { word: rarestResult.rows[0].word, timesThisUser: rarestResult.rows[0].times_made }
        : null,
      worldFirsts: worldFirstsResult.rows.map(r => r.word),
    };
  }

  res.status(201).json({ ...result.rows[0], wordStats });
});

app.get('/api/scores', async (req, res) => {
  const result = await pool.query(
    'SELECT id, username, score, game_mode, created_at FROM leaderboard ORDER BY score DESC LIMIT 10'
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

app.get('/api/user-stats', async (req, res) => {
  const username = req.query.username || 'anonymous';
  const [sizeResult, topWordsResult, rareWordsResult, worldFirstsResult] = await Promise.all([
    pool.query('SELECT COUNT(*)::int AS count FROM word_history WHERE username = $1', [username]),
    pool.query(
      'SELECT word, times_made FROM word_history WHERE username = $1 ORDER BY times_made DESC LIMIT 5',
      [username]
    ),
    pool.query(
      'SELECT word, times_made FROM word_history WHERE username = $1 ORDER BY times_made ASC LIMIT 5',
      [username]
    ),
    pool.query(
      `SELECT wh.word FROM word_history wh
       WHERE wh.username = $1
         AND NOT EXISTS (
           SELECT 1 FROM word_history wh2
           WHERE wh2.word = wh.word AND wh2.username != $1
         )
       ORDER BY wh.times_made DESC LIMIT 5`,
      [username]
    ),
  ]);
  res.json({
    vocabularySize: sizeResult.rows[0].count,
    topWords: topWordsResult.rows.map(r => ({ word: r.word, timesMade: r.times_made })),
    rareWords: rareWordsResult.rows.map(r => ({ word: r.word, timesMade: r.times_made })),
    worldFirsts: worldFirstsResult.rows.map(r => r.word),
  });
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
