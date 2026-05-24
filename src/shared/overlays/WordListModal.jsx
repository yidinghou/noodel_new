import { useState, useMemo } from 'react';
import { useDictionary } from '../../hooks/useDictionary.js';
import './WordListModal.css';

const PAGE_SIZE = 15;

export default function WordListModal({ words, newWords, onClose, title }) {
  const { dictionary } = useDictionary();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  const sorted = useMemo(() => [...words].sort(), [words]);

  const filtered = useMemo(() => {
    const q = search.trim().toUpperCase();
    return q ? sorted.filter(w => w.includes(q)) : sorted;
  }, [sorted, search]);

  const isSearching = search.trim().length > 0;
  const pageCount = isSearching ? 1 : Math.ceil(filtered.length / PAGE_SIZE);
  const displayed = isSearching ? filtered : filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(0);
  };

  return (
    <div className="wlm-backdrop" onClick={onClose}>
      <div className="wlm-card" onClick={e => e.stopPropagation()}>
        <button type="button" className="wlm-close" onClick={onClose} aria-label="Close">✕</button>
        <h2 className="wlm-title">{title}</h2>

        <div className="wlm-search-wrap">
          <input
            className="wlm-search"
            type="text"
            placeholder="Search words…"
            value={search}
            onChange={handleSearch}
            autoFocus
          />
        </div>

        {filtered.length === 0 ? (
          <p className="wlm-empty">{search ? 'No matching words.' : 'No words yet.'}</p>
        ) : (
          <div className="wlm-list">
            {displayed.map(word => (
              <div key={word} className="wlm-item">
                <div className="wlm-item__header">
                  <span className="wlm-item__word">{word}</span>
                  {newWords?.has(word) && <span className="wlm-item__badge">NEW</span>}
                </div>
                {dictionary && (
                  <span className="wlm-item__def">{dictionary.get(word) || '—'}</span>
                )}
              </div>
            ))}
          </div>
        )}

        {!isSearching && pageCount > 1 && (
          <div className="wlm-nav">
            <button
              className="wlm-nav__btn"
              onClick={() => setPage(p => p - 1)}
              disabled={page === 0}
            >‹ Prev</button>
            <span className="wlm-nav__label">Page {page + 1} of {pageCount}</span>
            <button
              className="wlm-nav__btn"
              onClick={() => setPage(p => p + 1)}
              disabled={page === pageCount - 1}
            >Next ›</button>
          </div>
        )}
      </div>
    </div>
  );
}
