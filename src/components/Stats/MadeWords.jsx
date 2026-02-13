import React from 'react';

function MadeWords({ words = [] }) {
  return (
    <div className="made-words-container">
      <div className="made-words-title">Words Made</div>
      <div className="words-list">
        {words.map((word, index) => (
          <div key={index} className="word-item">
            {word}
          </div>
        ))}
      </div>
    </div>
  );
}

export default MadeWords;
