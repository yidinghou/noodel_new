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


def build_frequency(words):
    """
    Compute raw letter frequency from the word corpus.

    Counts every letter occurrence across all words (not per-word) and
    normalizes. Returns a dict mapping each letter to its corpus frequency.
    """
    counts = defaultdict(int)
    for word in words:
        for ch in word:
            counts[ch] += 1
    total = sum(counts.values())
    return {l: counts.get(l, 0) / total for l in LETTERS}


def build_reverse_bigrams(words):
    """
    Compute backwards bigram transition probabilities from a word list.

    For every consecutive pair A→B in a word, records A as a predecessor of B.
    Returns reverse_bigrams[B][A] = P(A preceded B) = P(A | next=B).
    Uniform fallback for letters never observed as successors.
    """
    reverse_counts = defaultdict(lambda: defaultdict(int))

    for word in words:
        for i in range(len(word) - 1):
            reverse_counts[word[i + 1]][word[i]] += 1

    def normalize(counts_dict):
        total = sum(counts_dict.values())
        if total == 0:
            return {l: 1 / len(LETTERS) for l in LETTERS}
        return {k: v / total for k, v in counts_dict.items()}

    reverse_bigrams = {}
    for letter in LETTERS:
        if reverse_counts[letter]:
            reverse_bigrams[letter] = normalize(reverse_counts[letter])
        else:
            reverse_bigrams[letter] = {l: 1 / len(LETTERS) for l in LETTERS}

    return reverse_bigrams


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
    reverse_bigrams = build_reverse_bigrams(words)
    frequency = build_frequency(words)

    # Sanity check
    for letter in LETTERS:
        row_sum = sum(bigrams[letter].values())
        assert abs(row_sum - 1.0) < 1e-6, f"Row {letter} sums to {row_sum}"
        rev_sum = sum(reverse_bigrams[letter].values())
        assert abs(rev_sum - 1.0) < 1e-6, f"Reverse row {letter} sums to {rev_sum}"

    output = {"start": start, "bigrams": bigrams, "reverse_bigrams": reverse_bigrams, "frequency": frequency}
    output_path = os.path.join(base_dir, OUTPUT_PATH)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, sort_keys=True)

    print(f"Written to {output_path}")
    print(f"Top 5 start letters: {sorted(start.items(), key=lambda x: -x[1])[:5]}")
    print(f"Sample bigrams['T']: {sorted(bigrams['T'].items(), key=lambda x: -x[1])[:5]}")
    print(f"Top predecessors of H: {sorted(reverse_bigrams['H'].items(), key=lambda x: -x[1])[:5]}")
    print(f"Top predecessors of U: {sorted(reverse_bigrams['U'].items(), key=lambda x: -x[1])[:5]}")


if __name__ == "__main__":
    main()
