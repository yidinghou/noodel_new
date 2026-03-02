import { useState, useEffect } from 'react';

const WORD_FILES = [
  'words/3_letter_words.csv',
  'words/4_letter_words.csv',
  'words/5_letter_words.csv',
  'words/6_letter_words.csv',
  'words/7_letter_words.csv'
];

async function loadWordFile(filepath) {
  const response = await fetch(`${import.meta.env.BASE_URL}${filepath}`);
  if (!response.ok) throw new Error(`Failed to load ${filepath}`);

  const text = await response.text();
  const lines = text.split(/\r?\n/);
  const words = new Map();

  for (const line of lines) {
    if (!line.trim()) continue;
    const commaIndex = line.indexOf(',');
    if (commaIndex === -1) continue;
    const word = line.slice(0, commaIndex).toUpperCase().trim();
    const definition = line.slice(commaIndex + 1).trim();
    if (word) words.set(word, definition);
  }

  return words;
}

async function loadDictionary() {
  const allWords = new Map();

  for (const file of WORD_FILES) {
    try {
      const words = await loadWordFile(file);
      words.forEach((definition, word) => allWords.set(word, definition));
    } catch (error) {
      console.warn(`Failed to load ${file}:`, error);
    }
  }

  // Ensure tutorial words are always available
  if (!allWords.has('WORD')) allWords.set('WORD', 'a single unit of language');
  if (!allWords.has('WORDS')) allWords.set('WORDS', 'plural of word');

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
