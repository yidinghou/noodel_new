# Case study: "I can play the Daily Puzzle again"

This doc walks through a real bug found in this repo, using it as a vehicle
to teach three general concepts that show up constantly in web app
development:

1. Device-scoped vs. account-scoped state
2. Timezones and "what day is it?"
3. Race conditions from non-atomic check-then-act

## 1. The bug, as observed

The leaderboard (Postgres `leaderboard` table) should contain **at most one**
`game_mode = 'clear'` row per `(username, game_date)` — one Daily Puzzle
result per user per day. A production query for user `yiding` showed:

```
 id  | username | score | game_mode | game_date
-----+----------+-------+-----------+-----------
 105 | yiding   |    76 | clear     | 2026-06-11
...
  60 | yiding   |    57 | clear     | 2026-05-26
  59 | yiding   |    90 | clear     | 2026-05-26   <- duplicate!
...
  56 | yiding   |    90 | clear     | 2026-05-25
  55 | yiding   |    90 | clear     | 2026-05-25   <- duplicate!
```

Two completed Daily Puzzle runs landed for the same calendar day. The user
also reported that, after logging in on a different device, the "Daily
Puzzle" button was still clickable even though they'd already played that day
on their main device.

Three separate issues compound to cause this. Each is a pattern you'll meet
again in other projects.

---

## 2. Concept 1 — Device-scoped vs. account-scoped state

### The general idea

`localStorage` (and `sessionStorage`, and cookies set by the browser) live
**on one device, in one browser**. They are not synced anywhere. If your app
has a notion of "this user has done X", and you store that fact only in
`localStorage`, then the fact is really "**this browser** has seen evidence
that this user did X" — not "this user did X, period."

Anything that needs to be true *for an account*, regardless of which device
or browser they're using, has to be checked against a server (ultimately a
database), because the database is the one place every device can see.

### How it shows up in this codebase

`src/utils/playLimits.js`:

```js
function key(name) {
  return `noodel_${name}_${getUsername()}_${getToday()}`;
}

export function hasDailyBeenPlayed() {
  try {
    return localStorage.getItem(key('daily_played')) === 'true';
  } catch {
    return false;
  }
}

export function markDailyPlayed() {
  try {
    localStorage.setItem(key('daily_played'), 'true');
  } catch {
    // ignore
  }
}
```

And `src/shared/components/GameModePanel.jsx`:

```js
const [dailyPlayed, setDailyPlayed] = useState(hasDailyBeenPlayed());
```

`hasDailyBeenPlayed()` is the **first** thing that decides whether the
"Daily Puzzle" button is enabled — and it's a pure `localStorage` read.

So: user plays the Daily Puzzle on their laptop. `markDailyPlayed()` writes
`noodel_daily_played_yiding_2026-06-11 = 'true'` into the **laptop's**
`localStorage`. Then the user opens the game on their phone. The phone's
`localStorage` has never heard of this key — `hasDailyBeenPlayed()` returns
`false`, the button is enabled, and the user plays a second time.

### The lesson

> If a fact needs to hold "for this account, anywhere", store and check it
> server-side. Browser storage is fine for *device-local* preferences (like
> "skip animations") but not for *account-wide* facts (like "has this account
> played today's puzzle").

This codebase actually *does* have a server-side check too
(`/api/daily-status`, see below) — it's just not wired up tightly enough to
be the source of truth. That's concept 2.

---

## 3. Concept 2 — Timezones and "what day is it?"

### The general idea

`new Date()` on a user's browser gives you a date/time in **their local
timezone**. A Postgres database's `CURRENT_DATE` gives you the date in the
**database server's timezone** (commonly UTC, regardless of where users are).

These two are *not the same value* for roughly half of every 24-hour period,
for any user who isn't in the same timezone as the database. Concretely: if
the DB is UTC and a user is in US Eastern time (UTC-4/UTC-5), then for ~4-5
hours every day, "today" on the user's phone and "today" according to
`CURRENT_DATE` in Postgres are two different calendar dates.

This bites you anywhere code asks "is it still today?" / "has this happened
today?" and one side computes "today" from `new Date()` while the other side
uses `CURRENT_DATE`.

### How it shows up in this codebase

The client computes "today" using `getLocalDateString()` —
`src/utils/seededRandom.js`:

```js
/** Returns today's local date as YYYY-MM-DD (not UTC). */
export function getLocalDateString(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
```

This is used for the daily seed (`getDailyDateSeed()`, same file) and is sent
as `gameDate` when submitting a score
(`src/context/GameContext.jsx`):

```js
body: JSON.stringify({
  score: state.score,
  gameMode: state.gameMode,
  username,
  sessionData,
  wordsCleared: state.allWordsThisGame,
  gameDate: getLocalDateString(),   // <- client's local "today"
}),
```

But `/api/daily-status` (`server.js`) — the endpoint that's supposed to tell
a *new device* "yes, this account already played today" — does this:

```js
app.get('/api/daily-status', async (req, res) => {
  const username = req.query.username || 'anonymous';
  const result = await pool.query(
    `SELECT 1 FROM leaderboard
       WHERE username = $1 AND game_mode = 'clear' AND game_date = CURRENT_DATE
     LIMIT 1`,
    [username]
  );
  res.json({ played: result.rowCount > 0 });
});
```

`CURRENT_DATE` here is the **database's** date (effectively UTC on Railway).
But the row that was inserted earlier has `game_date` equal to the **client's
local date** (from `gameDate` above). For a user not in UTC, near midnight in
either timezone, `CURRENT_DATE` (server) and the stored `game_date` (client's
local date at submission time) can disagree — so this query can return
`played: false` even though the account already has a row for "today" from
the user's point of view.

### The lesson

> Pick **one** definition of "today" for a feature, compute it in **one
> place**, and pass that exact value through every step — don't let the
> client and server each independently call `new Date()` /
> `CURRENT_DATE` and assume they agree. Here, the client already computes
> `getLocalDateString()`; the fix is for `/api/daily-status` to accept that
> same string as a query parameter and compare against it, instead of
> recomputing "today" from the DB's clock.

---

## 4. Concept 3 — Race conditions: non-atomic "check, then act"

### The general idea

A very common (and very broken) pattern looks like this:

```
1. SELECT ... WHERE <condition>   -- "has this already happened?"
2. if no rows: INSERT ...         -- "ok, do it"
```

This looks correct when you trace through it for *one* request. It breaks
under concurrency: if **two requests run step 1 at nearly the same time**,
both can see "no rows" (because neither has inserted yet), and **both**
proceed to step 2 — producing two rows where you expected at most one.

```
Request A                      Request B
----------                      ----------
SELECT -> 0 rows
                                SELECT -> 0 rows
INSERT (row #1)
                                INSERT (row #2)   <- duplicate!
```

The gap between "check" and "act" is the race window. It doesn't matter how
small the gap is — under enough load (or just unlucky timing, e.g. two
devices both finishing a session and submitting around the same moment), it
will eventually be hit.

### How it shows up in this codebase

`server.js`, `POST /api/scores`:

```js
if ((gameMode || 'classic') === 'clear') {
  const dup = await pool.query(
    `SELECT 1 FROM leaderboard
       WHERE username = $1 AND game_mode = 'clear'
         AND game_date = COALESCE($2::date, CURRENT_DATE)
     LIMIT 1`,
    [user, datePart]
  );
  if (dup.rowCount > 0) return res.status(409).json({ error: 'already submitted' });
}

const result = await pool.query(
  'INSERT INTO leaderboard (score, game_mode, username, session_data, game_date) ' +
  'VALUES ($1, $2, $3, $4, COALESCE($5::date, CURRENT_DATE)) RETURNING ...',
  [score, gameMode || 'classic', user, sessionData ? JSON.stringify(sessionData) : null, datePart]
);
```

This is exactly the "SELECT to check, then INSERT" shape. There's no database
constraint that says "a `(username, game_date)` pair can only have one
`game_mode = 'clear'` row" — so nothing actually *enforces* the rule; the
`SELECT` is just Express *hoping* no one else inserts in between.

There's also a second problem, independent of the race: even on the request
that *does* get a `409`, the client doesn't look at it —
`src/context/GameContext.jsx`:

```js
fetch('/api/scores', { method: 'POST', ... })
  .then(r => r.json())          // <- never checks r.status / r.ok
  .then(data => {
    if (data.wordStats) dispatch({ type: A.SET_WORD_STATS, payload: data.wordStats });
  })
  .catch(() => {});
```

So even when the server *correctly* rejects a duplicate, the player's game
finishes normally with no indication anything was rejected — it just feels
like "I got to play again."

### The fix: push the constraint into the database

The robust fix is to make the database itself refuse to store a second row —
via a `UNIQUE` constraint — and use `INSERT ... ON CONFLICT DO NOTHING` so the
insert either succeeds or is atomically skipped, with no separate `SELECT`
and therefore no race window:

```sql
CREATE UNIQUE INDEX IF NOT EXISTS leaderboard_daily_unique_idx
  ON leaderboard (username, game_date)
  WHERE game_mode = 'clear';
```

```js
const result = await pool.query(
  `INSERT INTO leaderboard (score, game_mode, username, session_data, game_date)
   VALUES ($1, $2, $3, $4, COALESCE($5::date, CURRENT_DATE))
   ON CONFLICT (username, game_date) WHERE game_mode = 'clear' DO NOTHING
   RETURNING id, username, score, game_mode, created_at`,
  [score, gameMode || 'classic', user, sessionData ? JSON.stringify(sessionData) : null, datePart]
);
if (result.rowCount === 0) return res.status(409).json({ error: 'already submitted' });
```

Now, no matter how the two requests interleave, the database guarantees only
one of them ends up with a row.

### The lesson

> "Check, then act" across two separate statements is never safe under
> concurrency, no matter how unlikely the timing seems. If a uniqueness rule
> matters, encode it as a database constraint and use an atomic
> `INSERT ... ON CONFLICT` (Postgres) — don't simulate it with a `SELECT`
> first.

---

## 5. How the three combine

Putting it all together, here's the actual sequence that produces "I can play
the Daily Puzzle again":

1. **(Concept 1)** User plays the Daily Puzzle on Device A. `markDailyPlayed()`
   sets a `localStorage` flag — but only on Device A.
2. User opens the game on Device B (or clears `localStorage` on Device A).
   `hasDailyBeenPlayed()` is `false` there, so the "Daily Puzzle" button is
   enabled.
3. **(Concept 2)** `GameModePanel` calls `/api/daily-status` to double-check
   server-side — but that endpoint compares against `CURRENT_DATE` (DB/UTC),
   not the user's local date, so around midnight it can still report
   `played: false` even though Device A's row exists for "today" from the
   user's perspective.
4. The button stays enabled. The user plays the Daily Puzzle a second time.
5. **(Concept 3)** On completion, `POST /api/scores` runs its
   SELECT-then-INSERT dedup check. If the timing of this second submission
   happens to race with another in-flight submission (e.g. a cross-device
   session resume finishing around the same time), both SELECTs can see "no
   row yet" and both INSERTs succeed — producing the duplicate rows seen in
   the database.
6. Even in the cases where the dedup check *does* correctly return `409`,
   the client ignores the response and the game-over screen behaves as if
   everything succeeded — so from the player's point of view, they "got to
   play again" either way.

Each concept alone would only cause a minor edge case. Together, they add up
to a fully reproducible "play the daily puzzle twice" bug.

---

## 6. What the actual fix would look like (future work)

This doc is intentionally just the *explanation* — no code has been changed.
If/when this gets fixed, the changes map directly onto the three concepts
above:

- **Concept 3 fix** (`scripts/migrate.js`, `server.js`): add the partial
  `UNIQUE` index shown above, and switch `POST /api/scores` to
  `INSERT ... ON CONFLICT ... DO NOTHING`, returning `409` when `rowCount === 0`.
- **Concept 2 fix** (`server.js`, `GameModePanel.jsx`): have
  `/api/daily-status` accept a `date` query param (the client's
  `getLocalDateString()`) and compare against that instead of `CURRENT_DATE`.
- **Concept 1 fix** (`GameContext.jsx`): once `/api/daily-status` is
  accurate, have the score-submission `fetch` check `r.status` — on `409`,
  call `markDailyPlayed()` to correct the local flag, and avoid presenting
  the run as a fresh, scored completion.

With all three in place: the server becomes the single source of truth (no
more device-scoped gating gaps), "today" is unambiguous end-to-end, and the
database itself guarantees at most one Daily Puzzle leaderboard row per
account per day — regardless of timing or how many devices are involved.
