import React from 'react';
import { motion } from 'framer-motion';

const Cell = React.memo(({ letter, index, isMatched = false }) => {
  const cellClass = `block-base ${letter ? 'filled' : ''} ${isMatched ? 'matched' : ''}`;

  return (
    <motion.div
      layout
      className={cellClass}
      data-index={index}
    >
      {letter || ''}
    </motion.div>
  );
});

Cell.displayName = 'Cell';

export default Cell;
