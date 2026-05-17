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

## Database

The app requires `DATABASE_URL` in `.env`. The `.env` file has two URLs (`LOCAL_DATABASE_URL`, `RAILWAY_DATABASE_URL`) — toggle which one `DATABASE_URL` points to.

Run `npm run migrate` once to create the `leaderboard` table before starting the server locally.

Local PostgreSQL (Homebrew): `brew services start postgresql@16`, connect at `postgresql://localhost:5432/noodel_dev`.
