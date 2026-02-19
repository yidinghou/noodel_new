import { useEffect } from 'react';
import { useAnimate } from 'framer-motion';

// Pixels per second for the constant-speed drop phase
const DROP_SPEED = 800;

function DroppingOverlay({ letter, from, toTop, toFinal, cellSize, onComplete }) {
  const [scope, animate] = useAnimate();

  useEffect(() => {
    const run = async () => {
      // Phase 1: slide from preview tile to top of the clicked column
      await animate(
        scope.current,
        { x: toTop.x - from.x, y: toTop.y - from.y },
        { duration: 0.18, ease: 'easeOut' }
      );

      // Phase 2: drop at constant speed to the destination row
      const dropDistance = toFinal.y - toTop.y;
      const duration = Math.max(0.05, dropDistance / DROP_SPEED);
      await animate(
        scope.current,
        { y: toFinal.y - from.y },
        { duration, ease: 'linear' }
      );

      onComplete?.();
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