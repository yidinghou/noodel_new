import { useEffect } from 'react';
import { useAnimate } from 'framer-motion';

// Cells per second for the constant-speed drop phase
const DROP_SPEED_CELLS_PER_SEC = 10;
const LETTER_FROM_PREVIEW_TO_GRID_SPEED = 0.25

function DroppingOverlay({ id, column, letter, from, toTop, toFinal, cellSize, onComplete }) {
  const [scope, animate] = useAnimate();

  useEffect(() => {
    const run = async () => {
      // Phase 1: slide from preview tile to top of the clicked column
      await animate(
        scope.current,
        { x: toTop.x - from.x, y: toTop.y - from.y },
        { duration: LETTER_FROM_PREVIEW_TO_GRID_SPEED, ease: 'easeOut' }
      );

      // Phase 2: drop at constant speed to the destination row
      const dropDistance = toFinal.y - toTop.y;
      const dropCells = dropDistance / cellSize;
      const duration = Math.max(0.05, dropCells / DROP_SPEED_CELLS_PER_SEC);
      await animate(
        scope.current,
        { y: toFinal.y - from.y },
        { duration, ease: 'linear' }
      );

      onComplete?.(id, column);
    };

    run();
  }, []);

  return (
    <div
      ref={scope}
      className="dropping-letter-overlay animating"
      style={{
        left: from.x,
        top: from.y,
        width: cellSize,
        height: cellSize,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 'var(--size-font-grid)',
        fontWeight: 'bold',
      }}
    >
      {letter}
    </div>
  );
}

export default DroppingOverlay;