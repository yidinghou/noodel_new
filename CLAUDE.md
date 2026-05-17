# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Vite dev server at http://localhost:5173 (hot reload)
npm run build        # Production build → dist/
npm start            # Express server at http://localhost:3000 (serves dist/)
npm test             # Jest unit tests
npm run test:watch   # Jest in watch mode
npm test -- --testPathPattern=gameReducer  # Run single test file
npm run migrate      # Create leaderboard table in PostgreSQL
```

## Architecture

The app is a React 18 + Vite SPA deployed on Railway with an Express.js backend (`server.js`) that serves the built `dist/` and provides a leaderboard API (`POST/GET /api/scores`) backed by PostgreSQL.

**Vite multi-entry build**: Three entry points are bundled — `index.html` (main game), `poc.html` (prototype/how-to-play), and `game_replay.html` (replay viewer). Each has its own `src/.../main.jsx`.

### Game state: Context + Reducer

All runtime game state lives in `src/context/GameReducer.js` (`initialState`) and is distributed via `src/context/GameContext.jsx`. The state shape is:
- `grid`: flat 42-element array (6 rows × 7 cols), each cell is `null` or a tile object `{ char, id, type, isMatched, isPending, pendingDirections, ... }`
- `status`: `'IDLE' | 'PLAYING' | 'GAME_OVER' | 'PROCESSING'`
- `gameMode`: `'classic' | 'clear'`

### Core game loop (`src/hooks/useGameLogic.js`)

This is the most complex file. It drives the entire gameplay cycle:
1. Player drops a letter → `DROP_LETTER` action
2. Hook scans for words using `findWords()` from `wordUtils.js` (horizontal + vertical)
3. Detected words enter a **grace period** (1000ms) with a countdown animation — tracked in `pendingRef` (a `Map<wordKey, entry>`)
4. On expiry, intersecting words expire together (transitive BFS), triggering `SET_MATCHED_INDICES` → `REMOVE_WORDS` → `APPLY_GRAVITY`
5. After gravity, the loop re-scans for combo chains

### Session persistence (`src/services/gameSession.js`, `src/hooks/useGameSession.js`)

Sessions are **event-sourced** (schema v3): every `DROP_LETTER`, `WORDS_CLEARED`, and `GRAVITY` event is appended and immediately written to `localStorage`. On resume, state is derived from the stored checkpoint (not full event replay). The session model is pure (no React, no I/O) — all side effects live in the hook.

### Game modes

- **Classic**: score by word length; `calculateWordScore()` in `scoringUtils.js`
- **Clear**: board starts 20% pre-filled with blocks; score is set (not accumulated) to `lettersRemaining` at the time of each clear — the score reflects the most recent clear only; win condition is a fully empty board (all cells null, including player-placed tiles)

### URL debug flags

Append to any URL during development:
- `?debug=true` — debug overlay
- `?skipAnimations=true` — skip Framer Motion animations
- `?debugGrid=true` — grid pattern overlay

## Design Decisions

### Game loop timing constants (`src/hooks/useGameLogic.js`)

| Constant | Value | Purpose |
|---|---|---|
| `GRACE_PERIOD_MS` | 1000ms | How long a detected word shows its countdown before clearing |
| `SHAKE_DURATION_MS` | 400ms | Shake animation duration after `SET_MATCHED_INDICES` fires |
| `GRAVITY_DELAY_MS` | 150ms | Pause after tiles clear before gravity drops remaining tiles |

### `PROCESSING` status

`SET_MATCHED_INDICES` sets `status: 'PROCESSING'` while tiles are shaking. The word detection effect in `useGameLogic.js` checks `status !== 'PLAYING'` and skips, preventing double-detection of shaking tiles. However, the UI still allows player drops during `PROCESSING` — this is intentional so fast players aren't blocked during animations.

### Grace period word classification (`src/utils/gracePeriodUtils.js`)

Every grid change re-runs word detection. Each found word is classified against the current pending set:
- **`skip`**: same word already pending, or a same-direction partial overlap (only one timer runs per linear tile run to avoid timer proliferation)
- **`extend`**: new word is a strict superset of an existing same-direction pending word — replaces it with a fresh timer
- **`add`**: genuinely new word; also resets timers for all cross-direction words sharing any cell

### Transitive BFS expiration (`expireWord` in `useGameLogic.js`)

When a word's grace period expires, a BFS finds all pending words that intersect it (transitively). If A∩B and B∩C, then A, B, and C all expire together even if A∩C=∅. This prevents partial-word scenarios where two halves of a cross would disappear at different times.

### Gravity concurrency guards

Two refs prevent double-gravity when multiple words expire in the same tick:
- **`pendingRemovesRef`**: counts in-flight `REMOVE_WORDS` dispatches; gravity only schedules when this reaches 0
- **`gravityScheduledRef`**: set true the moment gravity is scheduled, blocks any subsequent expiry callbacks from scheduling a second gravity

### Session event sourcing (`src/services/gameSession.js`)

Events (DROP_LETTER, WORDS_CLEARED, GRAVITY) are recorded at the `wrappedDispatch` intercept in `GameContext.jsx` and written to `localStorage` immediately — every event is crash-safe. A checkpoint (derivable from events) is only stored at game-over as an optimization for fast resume. Mid-game resume falls back to full `replayAll()` from the event log. The session model itself is pure (no React, no I/O); all side effects live in `useGameSession.js`.

### Clear mode scoring design

In `REMOVE_WORDS`, Clear mode uses assignment (`totalScore = state.lettersRemaining`) not accumulation (`totalScore +=`). The final `score:` field is also set rather than added to. This means: your score equals the letters remaining at the time of your most recent clear, regardless of how many words cleared simultaneously. This is intentional — it creates a "beat the clock" feel where every drop costs potential score.

## Database

The app requires `DATABASE_URL` in `.env`. The `.env` file has two URLs (`LOCAL_DATABASE_URL`, `RAILWAY_DATABASE_URL`) — toggle which one `DATABASE_URL` points to.

Run `npm run migrate` once to create the `leaderboard` table before starting the server locally.

Local PostgreSQL (Homebrew): `brew services start postgresql@16`, connect at `postgresql://localhost:5432/noodel_dev`.
