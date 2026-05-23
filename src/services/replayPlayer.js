import { A } from '../utils/actionTypes.js';
import { GRACE_PERIOD_MS } from '../utils/gameConstants.js';

// Drives playback of a recorded session into a reducer dispatch.
// Pure module — no React. The caller wires it to a useReducer dispatch.

// Cap any single gap between events to this many ms. Matches GRACE_PERIOD_MS
// so a long player think-pause doesn't stall the replay.

export function createPlayer(
  events,
  dispatch,
  { now = () => performance.now(), reset = null, fastDispatch = null } = {}
) {
  if (!Array.isArray(events) || events.length === 0) {
    throw new Error('createPlayer: events must be a non-empty array');
  }

  // Boundaries are indices where the board is in a stable, displayable state:
  // every DROP_LETTER (pre-drop frame) and every position right after an
  // APPLY_GRAVITY (post-cascade frame), plus events.length as the terminal.
  const raw = [];
  for (let i = 0; i < events.length; i++) {
    if (events[i].type === A.DROP_LETTER) raw.push(i);
    if (events[i].type === A.APPLY_GRAVITY) raw.push(i + 1);
  }
  raw.push(events.length);
  raw.sort((a, b) => a - b);
  const boundaries = raw.filter((b, i) => i === 0 || b !== raw[i - 1]);
  const firstBoundary = boundaries[0] ?? events.length;
  const lastBoundary = boundaries[boundaries.length - 1] ?? events.length;

  let index = 0;
  let speed = 1;
  let playing = false;
  let stepping = false;
  let stepTarget = null;
  let timer = null;
  let inflight = null;
  let listeners = new Set();

  function emit() {
    listeners.forEach(fn => fn({ index, total: events.length, playing, speed }));
  }

  function clearTimer() {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  }

  function nextBoundary(from) {
    for (const b of boundaries) if (b > from) return b;
    return null;
  }

  function prevBoundary(from) {
    let prev = null;
    for (const b of boundaries) {
      if (b < from) prev = b;
      else break;
    }
    return prev;
  }

  async function dispatchOne(i, useFast) {
    const d = useFast && fastDispatch ? fastDispatch : dispatch;
    const ev = events[i];
    const result = d({ type: ev.type, payload: ev.payload });
    if (!useFast && result && typeof result.then === 'function') {
      await result;
    }
  }

  async function tick() {
    if (!playing) return;
    if (index >= events.length) { playing = false; emit(); return; }
    const currentIdx = index;
    const current = events[currentIdx];
    inflight = (async () => {
      await dispatchOne(currentIdx, false);
      index = currentIdx + 1;
      emit();
    })();
    try { await inflight; } finally { inflight = null; }
    if (stepTarget !== null && index >= stepTarget) {
      playing = false;
      stepTarget = null;
      emit();
      return;
    }
    if (!playing) return;
    if (index >= events.length) { playing = false; emit(); return; }
    const rawGap = events[index].t - current.t;
    const gap = Math.max(0, Math.min(rawGap, GRACE_PERIOD_MS));
    timer = setTimeout(tick, gap / speed);
  }

  return {
    play() {
      if (playing) return;
      if (index >= events.length) {
        clearTimer();
        index = 0;
        if (reset) reset();
      }
      stepTarget = null;
      playing = true;
      emit();
      tick();
    },
    pause() {
      if (!playing) return;
      stepTarget = null;
      playing = false;
      clearTimer();
      emit();
    },
    restart() {
      clearTimer();
      index = 0;
      if (reset) reset();
      stepTarget = null;
      playing = true;
      emit();
      tick();
    },
    setSpeed(mult) {
      speed = mult > 0 ? mult : 1;
      // If a timed gap is pending, re-schedule it at the new speed.
      if (playing && timer !== null) {
        clearTimer();
        timer = setTimeout(tick, 0);
      }
      emit();
    },

    // Advance to the next boundary, honoring recorded inter-event timing so
    // grace-period (green) states are visible. Auto-pauses on arrival.
    async stepForward() {
      if (stepping) return;
      stepping = true;
      try {
        if (playing) { playing = false; clearTimer(); }
        if (inflight) { try { await inflight; } catch {} }
        const target = nextBoundary(index);
        if (target === null) { emit(); return; }
        stepTarget = target;
        playing = true;
        emit();
        tick();
      } finally {
        stepping = false;
      }
    },

    // Rewind to the previous turn boundary by replaying from event 0 with
    // animations skipped. Auto-pauses.
    async stepBackward() {
      if (stepping) return;
      stepping = true;
      stepTarget = null;
      if (playing) {
        playing = false;
        clearTimer();
      }
      if (inflight) { try { await inflight; } catch {} }
      const target = prevBoundary(index);
      if (target === null) { stepping = false; emit(); return; }
      try {
        if (reset) reset();
        for (let i = 0; i < target; i++) {
          await dispatchOne(i, true);
        }
        index = target;
      } finally {
        stepping = false;
        emit();
      }
    },

    getProgress() {
      return { index, total: events.length, playing, speed };
    },
    getBoundaries() {
      return { first: firstBoundary, last: lastBoundary };
    },
    subscribe(fn) {
      listeners.add(fn);
      fn({ index, total: events.length, playing, speed });
      return () => listeners.delete(fn);
    },
    dispose() {
      clearTimer();
      listeners.clear();
    },
    _now: now,
  };
}
