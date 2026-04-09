import { useState, useEffect, useRef, useCallback } from 'react';

const LETTERS = ['N', 'O', 'O', 'D', 'E', 'L'];
const LETTER_DROP_ANIMATION_MS = 400;  // CSS animation duration
const LAST_LETTER_DROP_DELAY_MS = 5 * 200; // Last letter drops at 5 * 0.2s = 1.0s, plus animation duration

// Generate a random permutation of indices (0-5)
function generateRandomDropOrder() {
  const indices = [0, 1, 2, 3, 4, 5];
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  // Create a map: letterIndex -> dropOrder position
  const dropOrderMap = {};
  indices.forEach((letterIndex, dropPosition) => {
    dropOrderMap[letterIndex] = dropPosition;
  });
  return dropOrderMap;
}

export function useIntroSequence() {
  const [dropOrderMap] = useState(generateRandomDropOrder()); // Random drop order (stable across renders)
  const [controlsVisible, setControlsVisible] = useState(false);
  const [boardVisible, setBoardVisible] = useState(false);

  const timersRef = useRef([]);
  const isDoneRef = useRef(false);

  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  const fastForward = useCallback(() => {
    if (isDoneRef.current) return;
    isDoneRef.current = true;
    clearAllTimers();
    setControlsVisible(true);
    setBoardVisible(true);
  }, [clearAllTimers]);

  useEffect(() => {
    // Calculate timing: last letter drops at 5 * 0.2s = 1.0s, animates for 0.4s = 1.4s total
    const lastLetterFinishesAt = LAST_LETTER_DROP_DELAY_MS + LETTER_DROP_ANIMATION_MS;

    // Controls appear after last letter finishes
    const t2 = setTimeout(() => setControlsVisible(true), lastLetterFinishesAt + 200);
    timersRef.current.push(t2);

    // Board appears shortly after
    const t3 = setTimeout(() => {
      setBoardVisible(true);
      isDoneRef.current = true;
    }, lastLetterFinishesAt + 600);
    timersRef.current.push(t3);

    return clearAllTimers;
  }, [clearAllTimers]);

  return {
    dropOrderMap,
    controlsVisible,
    boardVisible,
    fastForward,
  };
}
