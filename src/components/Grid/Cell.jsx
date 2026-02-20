import React from 'react';
import { motion } from 'framer-motion';

// Fired when a tile locks into the grid — visual drop is handled by DroppingOverlay
const LOCKED_TO_GRID_ANIMATION = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.15, ease: 'easeOut' }
};

// Map directions to border styles using box-shadow
const computePendingStyles = (directions) => {
  if (!directions || directions.length === 0) return {};

  const shadows = [];

  // Check for horizontal word (left & right borders)
  if (directions.includes('horizontal')) {
    shadows.push('inset 3px 0 0 0 var(--color-pending-horizontal)');
    shadows.push('inset -3px 0 0 0 var(--color-pending-horizontal)');
  }

  // Check for vertical word (top & bottom borders)
  if (directions.includes('vertical')) {
    shadows.push('inset 0 3px 0 0 var(--color-pending-vertical)');
    shadows.push('inset 0 -3px 0 0 var(--color-pending-vertical)');
  }

  // Check for diagonal-down-right (all 4 borders)
  if (directions.includes('diagonal-down-right')) {
    shadows.push('inset 0 0 0 3px var(--color-pending-diagonal-down-right)');
  }

  // Check for diagonal-up-right (all 4 borders)
  if (directions.includes('diagonal-up-right')) {
    shadows.push('inset 0 0 0 3px var(--color-pending-diagonal-up-right)');
  }

  return {
    boxShadow: shadows.length > 0 ? shadows.join(', ') : undefined
  };
};

const Cell = React.memo(
  ({
    letter,
    index,
    isMatched = false,
    isPending = false,
    pendingDirections = [],
    pendingResetCount = 0
  }) => {
    const cellClass = [
      'block-base',
      'grid-square',
      letter ? 'filled' : '',
      isPending ? 'word-pending' : '',
      isMatched ? 'word-found' : '',
    ]
      .filter(Boolean)
      .join(' ');

    const pendingStyles = isPending ? computePendingStyles(pendingDirections) : {};

    // Include pendingResetCount in key to restart animation when timer resets
    const animationKey = `${letter}-${isPending ? pendingResetCount : 0}`;

    return (
      <motion.div
        key={animationKey}
        initial={letter ? LOCKED_TO_GRID_ANIMATION.initial : false}
        animate={LOCKED_TO_GRID_ANIMATION.animate}
        transition={LOCKED_TO_GRID_ANIMATION.transition}
        className={cellClass}
        style={pendingStyles}
        data-index={index}
      >
        {letter || ''}
      </motion.div>
    );
  }
);

Cell.displayName = 'Cell';

export default Cell;
