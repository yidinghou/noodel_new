"""
Builds bigram transition probabilities from the game word list.
Outputs src/assets/letter_markov.json for use by letterUtils.js.

Usage: python3 scripts/markov_analysis.py
"""

import csv
import json
import os
from collections import defaultdict

WORD_FILES = [
    "src/assets/words/3_letter_words.csv",
    "src/assets/words/4_letter_words.csv",
    "src/assets/words/5_letter_words.csv",
    "src/assets/words/6_letter_words.csv",
    "src/assets/words/7_letter_words.csv",
]
OUTPUT_PATH = "src/assets/letter_markov.json"
LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"


def load_words(base_dir):
    """Read all word CSVs and return a list of uppercase words (alpha-only)."""
    words = []
    for rel_path in WORD_FILES:
        path = os.path.join(base_dir, rel_path)
        with open(path, newline="", encoding="utf-8") as f:
            reader = csv.reader(f)
            next(reader, None)  # skip header
            for row in reader:
                if row:
                    word = row[0].strip().upper()
                    if word.isalpha():
                        words.append(word)
    return words


def build_tables(words):
    """
    Compute start unigram and bigram transition probabilities from a word list.

    Returns:
        start  - dict mapping each letter to P(word starts with that letter)
        bigrams - dict mapping each letter A to a dict of P(next=B | prev=A)
    """
    start_counts = defaultdict(int)
    bigram_counts = defaultdict(lambda: defaultdict(int))

    for word in words:
        if not word:
            continue
        start_counts[word[0]] += 1
        for i in range(len(word) - 1):
            bigram_counts[word[i]][word[i + 1]] += 1

    def normalize(counts_dict):
        total = sum(counts_dict.values())
        if total == 0:
            return {l: 1 / len(LETTERS) for l in LETTERS}
        return {k: v / total for k, v in counts_dict.items()}

    start = normalize(start_counts)

    # Ensure every letter has a bigram row (use uniform fallback for unseen letters)
    bigrams = {}
    for letter in LETTERS:
        if bigram_counts[letter]:
            bigrams[letter] = normalize(bigram_counts[letter])
        else:
            bigrams[letter] = {l: 1 / len(LETTERS) for l in LETTERS}

    return start, bigrams


def main():
    """Generate letter_markov.json from the game word list CSVs."""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    base_dir = os.path.dirname(script_dir)

    print(f"Loading words from {base_dir}...")
    words = load_words(base_dir)
    print(f"Loaded {len(words)} words.")

    start, bigrams = build_tables(words)

    # Sanity check
    for letter in LETTERS:
        row_sum = sum(bigrams[letter].values())
        assert abs(row_sum - 1.0) < 1e-6, f"Row {letter} sums to {row_sum}"

    output = {"start": start, "bigrams": bigrams}
    output_path = os.path.join(base_dir, OUTPUT_PATH)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, sort_keys=True)

    print(f"Written to {output_path}")
    print(f"Top 5 start letters: {sorted(start.items(), key=lambda x: -x[1])[:5]}")
    print(f"Sample bigrams['T']: {sorted(bigrams['T'].items(), key=lambda x: -x[1])[:5]}")


if __name__ == "__main__":
    main()
