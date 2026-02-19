import React from 'react';
import { motion } from 'framer-motion';

// Fired when a tile locks into the grid — visual drop is handled by DroppingOverlay
const LOCKED_TO_GRID_ANIMATION = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.15, ease: 'easeOut' }
};

const Cell = React.memo(({ letter, index, isMatched = false }) => {
  const cellClass = `block-base grid-square${letter ? ' filled' : ''}${isMatched ? ' matched' : ''}`;

  return (
    <motion.div
      layout
      key={letter}
      initial={letter ? LOCKED_TO_GRID_ANIMATION.initial : false}
      animate={{
        ...LOCKED_TO_GRID_ANIMATION.animate,
        scale: isMatched ? [1, 1.1, 1] : 1,
      }}
      transition={{
        ...LOCKED_TO_GRID_ANIMATION.transition,
        layout: { duration: 0.3 },
        scale: { duration: 0.6, repeat: isMatched ? 2 : 0 },
      }}
      className={cellClass}
      data-index={index}
    >
      {letter || ''}
    </motion.div>
  );
});

Cell.displayName = 'Cell';

export default Cell;
