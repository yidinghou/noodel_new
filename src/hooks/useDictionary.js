import { useState, useEffect } from 'react';

const WORD_FILES = [
  '/src/assets/words/3_letter_words.csv',
  '/src/assets/words/4_letter_words.csv',
  '/src/assets/words/5_letter_words.csv',
  '/src/assets/words/6_letter_words.csv',
  '/src/assets/words/7_letter_words.csv'
];

async function loadWordFile(filepath) {
  const response = await fetch(filepath);
  if (!response.ok) throw new Error(`Failed to load ${filepath}`);

  const text = await response.text();
  const lines = text.split(/\r?\n/);
  const words = new Set();

  for (const line of lines) {
    if (!line.trim()) continue;
    const [word] = line.split(',');
    if (word) words.add(word.toUpperCase().trim());
  }

  return words;
}

async function loadDictionary() {
  const allWords = new Set();

  for (const file of WORD_FILES) {
    try {
      const words = await loadWordFile(file);
      words.forEach(word => allWords.add(word));
    } catch (error) {
      console.warn(`Failed to load ${file}:`, error);
    }
  }

  return allWords;
}

export function useDictionary() {
  const [dictionary, setDictionary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDictionary()
      .then(dict => {
        setDictionary(dict);
        setLoading(false);
      })
      .catch(error => {
        console.error('Failed to load dictionary:', error);
        setLoading(false);
      });
  }, []);

  return { dictionary, loading };
}
