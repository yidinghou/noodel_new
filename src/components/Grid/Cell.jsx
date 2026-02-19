import React from 'react';
import { motion } from 'framer-motion';
import { GRID_COLS } from '../../utils/gameConstants.js';

const DROP_ANIMATION = {
  animate: { y: 0, opacity: 1 },
  transition: { y: { type: 'spring', stiffness: 300, damping: 20 } }
};

const Cell = React.memo(({ letter, index, isMatched = false, cellHeight = 0 }) => {
  const cellClass = `block-base ${letter ? 'filled' : ''}`;
  const row = Math.floor(index / GRID_COLS);

  return (
    <motion.div
      layout
      key={letter}
      initial={letter ? { y: -(row * cellHeight), opacity: 0 } : {
        backgroundColor: '#f5f5f5',
        color: 'rgba(255, 255, 255, 0)',
        border: '1px solid #e0e0e0'
      }}
      animate={{
        ...DROP_ANIMATION.animate,
        scale: isMatched ? [1, 1.1, 1] : 1,
        backgroundColor: letter
          ? (isMatched ? '#ffd700' : '#808080')
          : '#f5f5f5',
        color: letter ? '#ffffff' : 'rgba(255, 255, 255, 0)',
        border: letter ? '2px solid #4caf50' : '1px solid #e0e0e0'
      }}
      transition={{
        ...DROP_ANIMATION.transition,
        layout: { duration: 0.3 },
        scale: { duration: 0.6, repeat: isMatched ? 2 : 0 },
        default: { duration: 0.2 }
      }}
      className={cellClass}
      data-index={index}
      style={{
        fontSize: '1.5rem',
        fontWeight: 'bold'
      }}
    >
      {letter || ''}
    </motion.div>
  );
});

Cell.displayName = 'Cell';

export default Cell;
