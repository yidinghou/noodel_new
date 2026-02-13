import React from 'react';
import { motion } from 'framer-motion';

const Cell = React.memo(({ letter, index, isMatched = false }) => {
  const cellClass = `block-base ${letter ? 'filled' : ''} ${isMatched ? 'matched' : ''}`;

  return (
    <motion.div
      layout
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{
        scale: letter ? 1 : 0.8,
        opacity: letter ? 1 : 0.3,
        backgroundColor: isMatched ? '#ffd700' : undefined
      }}
      exit={{ scale: 0.5, opacity: 0 }}
      transition={{
        layout: { duration: 0.3 },
        default: { duration: 0.2 }
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
