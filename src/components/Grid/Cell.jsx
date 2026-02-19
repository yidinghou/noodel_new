import React from 'react';
import { motion } from 'framer-motion';

// Simple appear animation — the visual drop is handled by DroppingOverlay
const APPEAR_ANIMATION = {
  initial: { opacity: 0, scale: 0.75 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.15, ease: 'easeOut' }
};

const Cell = React.memo(({ letter, index, isMatched = false }) => {
  const cellClass = `block-base ${letter ? 'filled' : ''}`;

  return (
    <motion.div
      layout
      key={letter}
      initial={letter ? APPEAR_ANIMATION.initial : {
        backgroundColor: '#f5f5f5',
        color: 'rgba(255, 255, 255, 0)',
        border: '1px solid #e0e0e0'
      }}
      animate={{
        ...APPEAR_ANIMATION.animate,
        scale: isMatched ? [1, 1.1, 1] : 1,
        backgroundColor: letter
          ? (isMatched ? '#ffd700' : '#808080')
          : '#f5f5f5',
        color: letter ? '#ffffff' : 'rgba(255, 255, 255, 0)',
        border: letter ? '2px solid #4caf50' : '1px solid #e0e0e0'
      }}
      transition={{
        ...APPEAR_ANIMATION.transition,
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
