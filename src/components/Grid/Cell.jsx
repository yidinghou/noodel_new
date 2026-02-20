import React from 'react';
import { motion } from 'framer-motion';

// Fired when a tile locks into the grid — visual drop is handled by DroppingOverlay
const LOCKED_TO_GRID_ANIMATION = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.15, ease: 'easeOut' }
};

const Cell = React.memo(({ letter, index, isMatched = false, isPending = false }) => {
  const cellClass = [
    'block-base',
    'grid-square',
    letter ? 'filled' : '',
    isPending ? 'word-pending' : '',
    isMatched ? 'word-found' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <motion.div
      key={letter}
      initial={letter ? LOCKED_TO_GRID_ANIMATION.initial : false}
      animate={LOCKED_TO_GRID_ANIMATION.animate}
      transition={LOCKED_TO_GRID_ANIMATION.transition}
      className={cellClass}
      data-index={index}
    >
      {letter || ''}
    </motion.div>
  );
});

Cell.displayName = 'Cell';

export default Cell;
