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

### Replay overlay (`src/components/Replay/ReplayOverlay.jsx`)

The leaderboard shows a ▶ button next to each score. Clicking it fetches the stored session from `GET /api/scores/:id/session` and mounts `ReplayOverlay` via a React Portal in `App.jsx`.

**Frame pipeline** (all pure, no React hooks):

1. `buildReplayStates(session)` — single-pass replay using `replayStep` + `gameReducer`, returns `Map<seq, state>` for every event (`replayEngine.js`)
2. `buildTurns(session)` — groups events into turns: one `DROP_LETTER` + its trailing `WORDS_CLEARED`/`GRAVITY` events
3. `pairClearGravity(turnEvents)` — pairs each `WORDS_CLEARED` with its following `GRAVITY` so settled frames use post-gravity state (no holes in grid)
4. `buildFrames(turns, statesMap, preClearGrid)` — produces the final frame list

**Frame sequence per turn** (mirrors actual game flow):

| Frame | `isDropFrame` | `isMatchFrame` | Visual |
|---|---|---|---|
| Pre-drop | ✓ | — | Board before letter lands; `DroppingOverlay` animates |
| Grace | — | ✓ | Words highlighted green (`isPending`) — one per `WORDS_CLEARED` |
| Settled | — | — | Post-gravity state — one per `WORDS_CLEARED` |
| Post-drop (no clear) | — | — | Board after letter lands, no word formed |

**Pre-existing pending words**: Before each drop, words from the upcoming clear that are already fully formed (all tile indices non-null in the pre-drop grid) are pre-highlighted green on the drop frame — e.g. SIP is green while D is falling and about to form DIE.

**Drop animation** (`DroppingOverlay`): positions are computed by measuring `.game-grid` via `boardRef.current.querySelector('.game-grid').getBoundingClientRect()` — same element `GameLayout` measures. `cellSize = Math.min(colWidth, rowHeight)` with horizontal centering offset matches the game exactly. The animation drives frame advancement via `onComplete`; the playback `setTimeout` skips drop frames.

**Grace period CSS**: `--animation-duration-word-grace` is overridden on the board wrapper to `SPEEDS[speedIdx].ms * 0.5` so the `fillGreen` animation completes exactly as the frame transitions.

**Score deduplication** (`GameContext.jsx`): `scoreSubmittedRef` guards the `POST /api/scores` call so React Strict Mode's double-mount doesn't submit two entries. Reset to `false` on each `START_GAME`.

## Testing

### When to run Jest

Use Jest for unit tests of game logic, utilities, and reducers:

```bash
npm test                                        # Run all tests
npm test -- --testPathPattern=gameReducer       # Test a specific file
npm run test:watch                              # Watch mode
```

**Test when you change:**
- `src/context/GameReducer.js` — state transitions, action handling
- `src/utils/wordUtils.js` — word-finding logic (horizontal/vertical detection)
- `src/utils/gracePeriodUtils.js` — grace period word classification (skip/extend/add)
- `src/utils/scoringUtils.js` — score calculation
- Any utility in `src/utils/` with unit test coverage

### When to test the API

Use the running Express server to verify endpoint behavior:

```bash
npm run build && npm start
# Server at http://localhost:3000
```

**Test when you change:**
- `server.js` — routes, request handling, database queries
- Response format or status codes

**Key endpoints to verify:**

| Endpoint | How to test |
|---|---|
| `GET /api/scores?gameMode=clear&date=YYYY-MM-DD` | `curl 'http://localhost:3000/api/scores?gameMode=clear&date=2026-05-25'` |
| `GET /api/scores/my-best?username=test` | `curl 'http://localhost:3000/api/scores/my-best?username=test'` |
| `POST /api/scores` | Submit a game score via the UI or curl |
| `GET /api/scores/:id/session` | Click ▶ on a leaderboard score to verify replay data loads |
| `GET /api/user-stats?username=test` | Settings → Stats panel |
| `GET /api/vocabulary?username=test` | Settings → Vocabulary |

### When to test the UI

Use the running app in a browser to verify component behavior and visual correctness:

```bash
npm run build && npm start
# App at http://localhost:3000
```

**Test when you change:**
- `src/shared/overlays/SettingsMenu.jsx` — settings panels, buttons, lists
- `src/themes/classic/components/Overlays/GameOverOverlay.jsx` — game-over screen
- Theme files or styles
- Any hook or component that affects what users see

**Test flow:**

1. Open `http://localhost:3000` in a browser
2. Optionally set a username in DevTools → Application → LocalStorage (`noodel_username` = your test name)
3. Interact with the changed UI (open Settings, complete a game, switch themes, etc.)
4. Verify the expected behavior and visual result
5. Check adjacent UI for regressions (e.g., alignment, colors, responsive layout)

**Useful debug flags** (append to URL):

```
?skipAnimations=true     # Remove Framer Motion delays for faster testing
?debug=true              # Show debug overlay with game state
?debugGrid=true          # Show grid pattern on board
```

Example: `http://localhost:3000?skipAnimations=true&debug=true`

## Database

The app requires `DATABASE_URL` in `.env`. The `.env` file has two URLs (`LOCAL_DATABASE_URL`, `RAILWAY_DATABASE_URL`) — toggle which one `DATABASE_URL` points to.

Run `npm run migrate` once to create the `leaderboard` table before starting the server locally.

Local PostgreSQL (Homebrew): `brew services start postgresql@16`, connect at `postgresql://localhost:5432/noodel_dev`.

## Git Workflow

Branch naming: `feat/`, `fix/`, `chore/` prefixes. PRs target `main`. After merge, pull main and delete the branch.

### GitHub Issues

When a task is associated with a GH issue:
1. Read the issue before planning: `mcp__github__get_issue` (owner: yidinghou, repo: noodel_new, issue_number: N)
2. Follow the implementation plan in the issue comments
3. Include `Closes #N` in the PR body so GitHub auto-closes the issue on merge

### Commit convention
- One logical change per commit — keep commits atomic
- Prefix: `feat:` (new behaviour), `fix:` (bug/polish), `chore:` (tooling/docs)
- Never batch unrelated changes into one commit

### Commit → PR → Merge flow
1. Stage files by logical group and commit each atomically (`git add <specific files>`)
2. `git push -u origin <branch>`
3. Create PR via GitHub MCP: `mcp__github__create_pull_request` (owner: yidinghou, repo: noodel_new, base: main) — include `Closes #N` in the body when working from an issue
4. Merge via GitHub MCP: `mcp__github__merge_pull_request` (merge_method: merge)
5. `git checkout main && git pull && git branch -d <branch>`
