import { useState } from 'react';

function MadeWordsA({ words = [], dictionary = null }) {
  const [expanded, setExpanded] = useState(false);

  const reversed = [...words].reverse();
  const recent = reversed.slice(0, 3);
  const older = reversed.slice(3);
  const olderCount = older.length;

  return (
    <div className="rdw-container">
      <div className="rdw-header">
        <span className="rdw-label">Words Made</span>
        {words.length > 0 && (
          <span className="rdw-count">{words.length}</span>
        )}
      </div>

      <div className="rdw-list">
        {recent.map((entry, i) => {
          const word = typeof entry === 'string' ? entry : entry.word;
          const def = dictionary?.get(word);
          return (
            <div key={`${word}-${i}`} className="rdw-card">
              <span className="rdw-card__word">{word}</span>
              {def && <span className="rdw-card__def">{def}</span>}
            </div>
          );
        })}

        {expanded && older.map((entry, i) => {
          const word = typeof entry === 'string' ? entry : entry.word;
          const def = dictionary?.get(word);
          return (
            <div key={`${word}-older-${i}`} className="rdw-card rdw-card--older">
              <span className="rdw-card__word">{word}</span>
              {def && <span className="rdw-card__def">{def}</span>}
            </div>
          );
        })}
      </div>

      {olderCount > 0 && (
        <button className="rdw-toggle" onClick={() => setExpanded(e => !e)}>
          {expanded ? '▲ Show less' : `+ ${olderCount} earlier`}
        </button>
      )}
    </div>
  );
}

export default MadeWordsA;
