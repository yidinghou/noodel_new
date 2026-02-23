const ORDINALS = ['1st', '2nd', '3rd', '4th', '5th'];

function NextPreview({ nextLetters = [], visible = false, nextUpRef, showOrdinals = false, shiftKey = 0 }) {
  const displayLetters = nextLetters.slice(0, 5);

  return (
    <div className={`next-letters-preview${visible ? ' visible' : ''}`}>
      {Array(5).fill(null).map((_, index) => {
        const letter = displayLetters[index];
        const isEmpty = !letter;
        const isNextUp = visible && index === 0 && !isEmpty;
        let className = 'block-base preview-letter-block';
        if (isNextUp) className += ' next-up';
        if (isEmpty) className += ' empty';
        // Remount the next-up slot on each shift so the CSS pop animation replays.
        // Use a string prefix for index 0 to avoid key collisions with sibling slots
        // (e.g. shiftKey=1 would otherwise clash with slot index=1).
        const slotKey = index === 0 ? `next-up-${shiftKey}` : index;
        return (
          <div key={slotKey} className="tutorial-preview-slot">
            {showOrdinals && (
              <div className="tutorial-ordinal">{ORDINALS[index]}</div>
            )}
            <div
              ref={isNextUp ? nextUpRef : null}
              className={className}
              data-column={index}
            >
              {letter || ''}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default NextPreview;
