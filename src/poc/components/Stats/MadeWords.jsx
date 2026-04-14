import React from 'react';

function MadeWords({ words = [], dictionary = null }) {
  return (
    <div className="made-words-container">
      <div className="made-words-title">Words Made</div>
      <div className="words-list">
        {words.map((word, index) => {
          const definition = dictionary?.get(word.word);
          return (
            <div key={index} className="word-item">
              <span className="word-item-word">{word.word}</span>
              {definition && <span className="word-item-definition">{definition}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default MadeWords;
