import { useEffect } from 'react';
import { useGame } from '../context/GameContext.jsx';
import { useDictionary } from './useDictionary.js';
import { findWords } from '../utils/wordUtils.js';

export function useGameLogic() {
  const { state, dispatch } = useGame();
  const { dictionary } = useDictionary();

  // Check for words after grid changes
  useEffect(() => {
    if (!dictionary || state.status !== 'PLAYING') return;

    // Check if there are any words on the grid
    const foundWords = findWords(state.grid, dictionary);

    if (foundWords.length > 0) {
      // Process words with a small delay for animation
      const timer = setTimeout(() => {
        dispatch({ type: 'REMOVE_WORDS', payload: { dictionary } });

        // Apply gravity after a delay
        setTimeout(() => {
          dispatch({ type: 'APPLY_GRAVITY' });
        }, 300);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [state.grid, state.status, dictionary, dispatch]);

  return { dictionary };
}
