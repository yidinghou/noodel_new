import { computeStreak } from '../utils/streakUtils.js';

// Fixed anchor: 2026-06-02 (a Monday)
const TODAY = new Date('2026-06-02T12:00:00');

// Returns a { game_date } row for `n` days before TODAY
function ago(n) {
  const d = new Date(TODAY);
  d.setDate(d.getDate() - n);
  return { game_date: d.toISOString().slice(0, 10) };
}

describe('computeStreak', () => {
  test('returns 0 for empty array', () => {
    expect(computeStreak([], TODAY)).toBe(0);
  });

  test('returns 1 for today only', () => {
    expect(computeStreak([ago(0)], TODAY)).toBe(1);
  });

  test('returns 1 for yesterday only', () => {
    expect(computeStreak([ago(1)], TODAY)).toBe(1);
  });

  test('returns 0 when most recent is 2 days ago (stale)', () => {
    expect(computeStreak([ago(2)], TODAY)).toBe(0);
  });

  test('returns 0 when most recent is a week ago', () => {
    expect(computeStreak([ago(7), ago(8), ago(9)], TODAY)).toBe(0);
  });

  test('counts 3-day streak ending today', () => {
    expect(computeStreak([ago(0), ago(1), ago(2)], TODAY)).toBe(3);
  });

  test('counts 3-day streak ending yesterday', () => {
    expect(computeStreak([ago(1), ago(2), ago(3)], TODAY)).toBe(3);
  });

  test('stops at a gap — today + 2 days ago (missing yesterday)', () => {
    expect(computeStreak([ago(0), ago(2)], TODAY)).toBe(1);
  });

  test('stops at a gap mid-streak', () => {
    // today, yesterday, then gap, then 3 days ago
    expect(computeStreak([ago(0), ago(1), ago(3)], TODAY)).toBe(2);
  });

  test('counts 6-day streak (full NOODEL)', () => {
    const rows = [ago(0), ago(1), ago(2), ago(3), ago(4), ago(5)];
    expect(computeStreak(rows, TODAY)).toBe(6);
  });

  test('counts streaks longer than 6', () => {
    const rows = Array.from({ length: 10 }, (_, i) => ago(i));
    expect(computeStreak(rows, TODAY)).toBe(10);
  });

  test('handles Date objects in game_date (not just strings)', () => {
    const d = new Date(TODAY);
    expect(computeStreak([{ game_date: d }], TODAY)).toBe(1);
  });
});

describe('computeStreak — timezone edge cases', () => {
  // Simulate a user in UTC+14 (far ahead of UTC).
  // At 1am their local time on June 2, the server UTC clock is still June 1.
  // The client sends game_date='2026-06-02' (their local date) and today='2026-06-02'.
  // The streak should resolve against the client-supplied today, not the server's UTC date.
  test('UTC+14 user: client today is June 2, server UTC is June 1 — streak active', () => {
    const clientToday = new Date('2026-06-02'); // client's local date as sent to server
    const rows = [{ game_date: '2026-06-02' }, { game_date: '2026-06-01' }];
    expect(computeStreak(rows, clientToday)).toBe(2);
  });

  // Simulate a user in UTC-12 (far behind UTC).
  // At 11pm their local June 1, the server UTC clock is already June 2.
  // Client sends today='2026-06-01'. The June 1 game_date is "today" from their perspective.
  test('UTC-12 user: client today is June 1, server UTC is June 2 — streak active', () => {
    const clientToday = new Date('2026-06-01');
    const rows = [{ game_date: '2026-06-01' }, { game_date: '2026-05-31' }];
    expect(computeStreak(rows, clientToday)).toBe(2);
  });

  // Without client-supplied today, using the server's UTC date of June 2 would make
  // June 1 "yesterday" — still active. But if the server were June 3, the June 1 record
  // would be stale. Verify the stale cutoff respects the anchor.
  test('record is stale relative to the supplied today anchor', () => {
    const clientToday = new Date('2026-06-04');
    const rows = [{ game_date: '2026-06-02' }]; // 2 days before anchor
    expect(computeStreak(rows, clientToday)).toBe(0);
  });
});
