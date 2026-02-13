import React from 'react';

function NextPreview({ nextLetters = [], visible = false }) {
  const displayLetters = nextLetters.slice(0, 5);

  return (
    <div
      className="next-letters-preview"
      style={{
        display: 'flex',
        opacity: visible ? 1 : 0,
        visibility: visible ? 'visible' : 'hidden'
      }}
    >
      {Array(5).fill(null).map((_, index) => (
        <div
          key={index}
          className="block-base preview-letter-block"
          data-column={index}
        >
          {displayLetters[index] || ''}
        </div>
      ))}
    </div>
  );
}

export default NextPreview;
