const SLOTS = 5;

function NextRow({ letters = [], lettersLeft = null, firstTileRef }) {
  return (
    <section className="rd-next-row" aria-label="Next letters">
      <div className="rd-next-row__left">
        <span className="rd-next-row__label">Next</span>
        <div className="rd-next-tiles">
          {Array.from({ length: SLOTS }).map((_, i) => {
            const ch = letters[i];
            const empty = !ch;
            return (
              <div
                key={i}
                ref={i === 0 ? firstTileRef : undefined}
                className={`rd-tile rd-tile--mini${i === 0 && !empty ? ' is-up-next' : ''}${empty ? ' is-empty' : ''}`}
              >
                {empty ? '' : ch}
              </div>
            );
          })}
        </div>
      </div>
      <div className="rd-next-row__right">
        {lettersLeft != null && (
          <>
            <span className="rd-next-row__label">Letters Left</span>
            <span className="rd-next-row__value">{lettersLeft}</span>
          </>
        )}
      </div>
    </section>
  );
}

export default NextRow;
