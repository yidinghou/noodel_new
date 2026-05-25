const DAILY_PLAYS = 3;
const BONUS_PLAYS = 10;
const VALID_CODES = ['NOODEL10'];

export function getToday() {
  return new Date().toISOString().split('T')[0];
}

function key(name) {
  return `noodel_${name}_${getToday()}`;
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

export function getUnlimitedRemaining() {
  try {
    const used = parseInt(localStorage.getItem(key('unlimited_used')) ?? '0', 10);
    const bonus = parseInt(localStorage.getItem(key('unlock_bonus')) ?? '0', 10);
    return Math.max(0, DAILY_PLAYS + bonus - used);
  } catch {
    return DAILY_PLAYS;
  }
}

export function consumeUnlimitedPlay() {
  try {
    const used = parseInt(localStorage.getItem(key('unlimited_used')) ?? '0', 10);
    localStorage.setItem(key('unlimited_used'), String(used + 1));
  } catch {
    // ignore
  }
}

// Returns 'ok' | 'invalid' | 'already_used'
export function redeemCode(code) {
  const normalized = (code ?? '').trim().toUpperCase();
  if (!VALID_CODES.includes(normalized)) return 'invalid';
  try {
    const usedKey = `noodel_code_used_${normalized}_${getToday()}`;
    if (localStorage.getItem(usedKey) === '1') return 'already_used';
    localStorage.setItem(usedKey, '1');
    const bonus = parseInt(localStorage.getItem(key('unlock_bonus')) ?? '0', 10);
    localStorage.setItem(key('unlock_bonus'), String(bonus + BONUS_PLAYS));
  } catch {
    // ignore
  }
  return 'ok';
}
