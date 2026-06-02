/**
 * Counts consecutive days in a sorted-DESC array of { game_date } rows.
 * A streak is only "active" if the most recent date is today or yesterday.
 *
 * @param {{ game_date: string|Date }[]} dates - sorted newest-first
 * @param {Date} [today] - injectable for testing; defaults to now
 */
// Normalise any Date or date-string to a UTC-midnight timestamp (ms).
// Date-only strings like '2026-06-01' are already parsed as UTC midnight by the JS spec,
// so we must work in UTC throughout to avoid local-timezone mismatches.
function utcDay(d) {
  const raw = new Date(d);
  return Date.UTC(raw.getUTCFullYear(), raw.getUTCMonth(), raw.getUTCDate());
}

export function computeStreak(dates, today = new Date()) {
  if (!dates.length) return 0;

  const todayMs = utcDay(today);
  const yesterdayMs = todayMs - 864e5; // 24 h in ms

  const mostRecentMs = utcDay(dates[0].game_date);
  if (mostRecentMs < yesterdayMs) return 0;

  let streak = 0;
  let expectedMs = mostRecentMs;
  for (const row of dates) {
    const dMs = utcDay(row.game_date);
    if (dMs === expectedMs) {
      streak++;
      expectedMs -= 864e5;
    } else {
      break;
    }
  }
  return streak;
}
