import React from 'react';

function Header() {
  const letters = ['N', 'O', 'O', 'D', 'E', 'L'];

  return (
    <div className="title">
      {letters.map((letter, index) => (
        <div key={index} className="block-base letter-block">
          {letter}
        </div>
      ))}
    </div>
  );
}

export default Header;
