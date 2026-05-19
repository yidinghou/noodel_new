import React from 'react';

function MadeWords({ words = [], dictionary = null, visible = true }) {
  return (
    <div className={`made-words-container ${visible ? 'visible' : ''}`}>
      <div className="made-words-title">Words Made</div>
      <div className="words-list">
        {words.map((entry, index) => {
          const word = typeof entry === 'string' ? entry : entry.word;
          const definition = dictionary?.get(word);
          return (
            <div key={`${word}-${index}`} className="word-item">
              <span className="word-item-word">{word}</span>
              {definition && <span className="word-item-definition">{definition}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default MadeWords;
