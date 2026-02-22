const ORDINALS = ['1st', '2nd', '3rd', '4th', '5th'];

function NextPreview({ nextLetters = [], visible = false, nextUpRef, showOrdinals = false }) {
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
        return (
          <div key={index} className="tutorial-preview-slot">
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
