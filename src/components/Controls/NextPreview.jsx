function NextPreview({ nextLetters = [], visible = false }) {
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
          <div key={index} className={className} data-column={index}>
            {letter || ''}
          </div>
        );
      })}
    </div>
  );
}

export default NextPreview;
