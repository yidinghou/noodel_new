import React from 'react';

function Header({ dropOrderMap = {} }) {
  const LETTERS = ['N', 'O', 'O', 'D', 'E', 'L'];

  return (
    <div className="title">
      {LETTERS.map((letter, index) => {
        // Get the drop order position for this letter (0-5 position in random drop sequence)
        const dropOrder = dropOrderMap[index] ?? index;
        return (
          <div
            key={index}
            className="block-base letter-block"
            style={{ '--drop-order': dropOrder }}
          >
            {letter}
          </div>
        );
      })}
    </div>
  );
}

export default Header;
