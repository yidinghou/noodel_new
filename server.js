
import 'dotenv/config';
import express from 'express';
import expressStaticGzip from 'express-static-gzip';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import pg from 'pg';
import { computeStreak } from './src/utils/streakUtils.js';

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const DIST = path.join(__dirname, 'dist');

app.use(express.json({ limit: '2mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    console.log(`${req.method} ${req.path} ${res.statusCode} ${Date.now() - start}ms`);
  });
  next();
});

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
  try {
    const { score, gameMode, username, sessionData, wordsCleared, gameDate } = req.body;
    if (typeof score !== 'number') return res.status(400).json({ error: 'score required' });
    const user = username || 'anonymous';
    const datePart = (gameDate && /^\d{4}-\d{2}-\d{2}$/.test(gameDate)) ? gameDate : null;
    if ((gameMode || 'classic') === 'clear') {
      const dup = await pool.query(
        `SELECT 1 FROM leaderboard WHERE username = $1 AND game_mode = 'clear' AND game_date = COALESCE($2::date, CURRENT_DATE) LIMIT 1`,
        [user, datePart]
      );
      if (dup.rowCount > 0) return res.status(409).json({ error: 'already submitted' });
    }
    const result = await pool.query(
      'INSERT INTO leaderboard (score, game_mode, username, session_data, game_date) VALUES ($1, $2, $3, $4, COALESCE($5::date, CURRENT_DATE)) RETURNING id, username, score, game_mode, created_at',
      [score, gameMode || 'classic', user, sessionData ? JSON.stringify(sessionData) : null, datePart]
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
      const longestWord = words.reduce((best, w) => w.length > best.length ? w : best, words[0]);
      const [sizeResult, newWordsResult] = await Promise.all([
        pool.query('SELECT COUNT(*)::int AS count FROM word_history WHERE username = $1', [user]),
        pool.query(
          'SELECT word FROM word_history WHERE username = $1 AND word = ANY($2::text[]) AND times_made = 1',
          [user, words]
        ),
      ]);
      wordStats = {
        vocabularySize: sizeResult.rows[0].count,
        newWords: newWordsResult.rows.map(r => r.word),
        longestWord,
      };
    }

    res.status(201).json({ ...result.rows[0], wordStats });
  } catch (err) {
    console.error('POST /api/scores error:', err);
    res.status(500).json({ error: 'internal server error' });
  }
});

app.get('/api/scores', async (req, res) => {
  try {
    const username = req.query.username || '';
    const gameMode = req.query.gameMode || '';
    let dateParam = req.query.date || null;

    // Validate date format if provided
    if (dateParam && !/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
      return res.status(400).json({ error: 'invalid date format; use YYYY-MM-DD' });
    }

    const result = await pool.query(
      `WITH best_per_user AS (
        SELECT DISTINCT ON (username) id, username, score, game_mode, created_at, game_date
        FROM leaderboard
        WHERE game_date = COALESCE($3::date, CURRENT_DATE)
          AND ($2 = '' OR game_mode = $2)
        ORDER BY username, score DESC
      ),
      ranked AS (
        SELECT *, RANK() OVER (ORDER BY score DESC)::int AS rank
        FROM best_per_user
      )
      SELECT * FROM ranked
      WHERE rank <= 5 OR username = $1
      ORDER BY rank`,
      [username, gameMode, dateParam]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('GET /api/scores error:', err);
    res.status(500).json({ error: 'internal server error' });
  }
});

app.get('/api/daily-status', async (req, res) => {
  try {
    const username = req.query.username || 'anonymous';
    const result = await pool.query(
      `SELECT 1 FROM leaderboard WHERE username = $1 AND game_mode = 'clear' AND game_date = CURRENT_DATE LIMIT 1`,
      [username]
    );
    res.json({ played: result.rowCount > 0 });
  } catch (err) {
    console.error('GET /api/daily-status error:', err);
    res.status(500).json({ error: 'internal server error' });
  }
});

app.get('/api/scores/:id/session', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT session_data FROM leaderboard WHERE id = $1',
      [id]
    );
    if (!result.rows.length || !result.rows[0].session_data) {
      return res.status(404).json({ error: 'session not found' });
    }
    res.json(result.rows[0].session_data);
  } catch (err) {
    console.error('GET /api/scores/:id/session error:', err);
    res.status(500).json({ error: 'internal server error' });
  }
});

app.get('/api/scores/my-best', async (req, res) => {
  try {
    const username = req.query.username || 'anonymous';
    const result = await pool.query(
      `SELECT id, username, score, game_mode, game_date, created_at
       FROM leaderboard
       WHERE username = $1
       ORDER BY score DESC
       LIMIT 5`,
      [username]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('GET /api/scores/my-best error:', err);
    res.status(500).json({ error: 'internal server error' });
  }
});

app.get('/api/vocabulary', async (req, res) => {
  try {
    const username = req.query.username || 'anonymous';
    const result = await pool.query(
      'SELECT word, times_made FROM word_history WHERE username = $1 ORDER BY word ASC',
      [username]
    );
    res.json({ words: result.rows.map(r => ({ word: r.word, timesMade: r.times_made })) });
  } catch (err) {
    console.error('GET /api/vocabulary error:', err);
    res.status(500).json({ error: 'internal server error' });
  }
});

app.get('/api/user-stats', async (req, res) => {
  try {
    const username = req.query.username || 'anonymous';
    const [sizeResult, topWordsResult, rareWordsResult] = await Promise.all([
      pool.query('SELECT COUNT(*)::int AS count FROM word_history WHERE username = $1', [username]),
      pool.query(
        'SELECT word, times_made FROM word_history WHERE username = $1 ORDER BY times_made DESC, last_made_at DESC LIMIT 5',
        [username]
      ),
      pool.query(
        'SELECT word, times_made FROM word_history WHERE username = $1 ORDER BY times_made ASC, last_made_at DESC LIMIT 5',
        [username]
      ),
    ]);
    res.json({
      vocabularySize: sizeResult.rows[0].count,
      topWords: topWordsResult.rows.map(r => ({ word: r.word, timesMade: r.times_made, isNew: r.times_made === 1 })),
      rareWords: rareWordsResult.rows.map(r => ({ word: r.word, timesMade: r.times_made, isNew: r.times_made === 1 })),
    });
  } catch (err) {
    console.error('GET /api/user-stats error:', err);
    res.status(500).json({ error: 'internal server error' });
  }
});

app.get('/api/streaks', async (req, res) => {
  try {
    const username = req.query.username || 'anonymous';
    // Use the client's local date as "today" so streak computation matches the
    // user's timezone rather than the server's UTC clock.
    const today = req.query.date ? new Date(req.query.date) : new Date();
    const [loginRows, clearRows] = await Promise.all([
      pool.query(
        `SELECT DISTINCT game_date FROM leaderboard
         WHERE username = $1 AND game_date <= $2
         ORDER BY game_date DESC LIMIT 60`,
        [username, today]
      ),
      pool.query(
        `SELECT DISTINCT game_date FROM leaderboard
         WHERE username = $1 AND game_mode = 'clear' AND game_date <= $2
         ORDER BY game_date DESC LIMIT 60`,
        [username, today]
      ),
    ]);

    res.json({
      loginStreak: computeStreak(loginRows.rows, today),
      clearStreak: computeStreak(clearRows.rows, today),
    });
  } catch (err) {
    console.error('GET /api/streaks error:', err);
    res.status(500).json({ error: 'internal server error' });
  }
});

app.get('/api/users/check', async (req, res) => {
  const { username } = req.query;
  if (!username) return res.status(400).json({ error: 'username required' });
  try {
    const result = await pool.query('SELECT 1 FROM users WHERE username = $1', [username.trim().toLowerCase()]);
    res.json({ available: result.rowCount === 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/users', async (req, res) => {
  const raw = (req.body?.username ?? '').trim().toLowerCase();
  if (!raw) return res.status(400).json({ error: 'username required' });
  if (raw.length > 20) return res.status(400).json({ error: 'Username too long (max 20 characters)' });
  if (!/^[a-zA-Z0-9_]+$/.test(raw)) return res.status(400).json({ error: 'Only letters, numbers, and underscores allowed' });
  try {
    const result = await pool.query(
      'INSERT INTO users (username) VALUES ($1) ON CONFLICT DO NOTHING RETURNING username',
      [raw]
    );
    if (result.rowCount === 0) return res.status(409).json({ error: 'Username already taken' });
    res.status(201).json({ username: raw });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// In-progress session storage — enables cross-device resume for the same account
app.put('/api/session', async (req, res) => {
  try {
    const { username, snapshot } = req.body;
    if (!username || !snapshot) return res.status(400).json({ error: 'username and snapshot required' });
    await pool.query(
      `INSERT INTO active_sessions (username, game_type, snapshot, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (username) DO UPDATE
         SET game_type = EXCLUDED.game_type,
             snapshot  = EXCLUDED.snapshot,
             updated_at = NOW()`,
      [username, snapshot.events?.find(e => e.type === 'START_GAME')?.payload?.gameType ?? null, JSON.stringify(snapshot)]
    );
    res.status(204).end();
  } catch (err) {
    console.error('PUT /api/session error:', err);
    res.status(500).json({ error: 'internal server error' });
  }
});

app.get('/api/session', async (req, res) => {
  try {
    const { username } = req.query;
    if (!username) return res.status(400).json({ error: 'username required' });
    const result = await pool.query(
      'SELECT snapshot FROM active_sessions WHERE username = $1',
      [username]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'no active session' });
    res.json({ snapshot: result.rows[0].snapshot });
  } catch (err) {
    console.error('GET /api/session error:', err);
    res.status(500).json({ error: 'internal server error' });
  }
});

app.delete('/api/session', async (req, res) => {
  try {
    const { username } = req.query;
    if (!username) return res.status(400).json({ error: 'username required' });
    await pool.query('DELETE FROM active_sessions WHERE username = $1', [username]);
    res.status(204).end();
  } catch (err) {
    console.error('DELETE /api/session error:', err);
    res.status(500).json({ error: 'internal server error' });
  }
});

// Serve known HTML entry points directly; fall back to index.html for SPA routes
const HTML_ENTRIES = ['index.html'];
app.get('*', (req, res) => {
  const requested = path.basename(req.path);
  const file = HTML_ENTRIES.includes(requested) ? requested : 'index.html';
  res.sendFile(path.join(DIST, file));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🎮 NOODEL Word Game server running on port ${PORT}`);
  console.log(`🌐 Access at: http://localhost:${PORT}`);
});
