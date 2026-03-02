import React from 'react';

function Header({ dropOrderMap = {}, onUndo }) {
  const LETTERS = ['N', 'O', 'O', 'D', 'E', 'L'];

  const handleUndoClick = (e) => {
    e.stopPropagation();
    if (onUndo) {
      const success = onUndo();
      if (success) {
        // Visual feedback on successful undo
        const target = e.currentTarget;
        target.style.opacity = '0.5';
        setTimeout(() => {
          target.style.opacity = '1';
        }, 100);
      }
    }
  };

  return (
    <div className="title">
      {LETTERS.map((letter, index) => {
        // Get the drop order position for this letter (0-5 position in random drop sequence)
        const dropOrder = dropOrderMap[index] ?? index;
        // Second O (index 2) is the hidden undo button
        const isUndoButton = index === 2;
        return (
          <div
            key={index}
            className={`block-base letter-block${isUndoButton ? ' undo-button' : ''}`}
            style={{ '--drop-order': dropOrder }}
            onClick={isUndoButton ? handleUndoClick : undefined}
            title={isUndoButton ? 'Click to undo (hidden feature)' : undefined}
          >
            {letter}
          </div>
        );
      })}
    </div>
  );
}

export default Header;
