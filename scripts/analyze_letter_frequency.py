"""
Compare letter frequencies produced by the Markov generator against
natural dictionary frequencies.

Ports the JS generation logic from src/utils/letterUtils.js to Python
and runs many trials, then prints a side-by-side comparison table.

Usage: python3 scripts/analyze_letter_frequency.py
"""

import csv
import json
import os
import random
from collections import defaultdict

WORD_FILES = [
    "src/assets/words/3_letter_words.csv",
    "src/assets/words/4_letter_words.csv",
    "src/assets/words/5_letter_words.csv",
    "src/assets/words/6_letter_words.csv",
    "src/assets/words/7_letter_words.csv",
]
MARKOV_JSON = "src/assets/letter_markov.json"
LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
VOWELS = set("AEIOU")

SEQUENCE_LENGTH = 200
NUM_TRIALS = 500
EPSILON = 1e-6


# ---------------------------------------------------------------------------
# Dictionary frequency baseline
# ---------------------------------------------------------------------------

def load_dict_freq(base_dir):
    """Count every letter occurrence across all word CSVs and normalize."""
    counts = defaultdict(int)
    for rel_path in WORD_FILES:
        path = os.path.join(base_dir, rel_path)
        with open(path, newline="", encoding="utf-8") as f:
            reader = csv.reader(f)
            next(reader, None)
            for row in reader:
                if row:
                    for ch in row[0].strip().upper():
                        if ch.isalpha():
                            counts[ch] += 1
    total = sum(counts.values())
    return {l: counts[l] / total for l in LETTERS}


# ---------------------------------------------------------------------------
# Python port of letterUtils.js generation logic
# ---------------------------------------------------------------------------

def sample(dist, letters):
    """Cumulative-weight random sampling from a probability dict."""
    r = random.random() * sum(dist[l] for l in letters)
    cumulative = 0.0
    for l in letters:
        cumulative += dist[l]
        if r <= cumulative:
            return l
    return letters[-1]


def forward_blend(history, bigrams, letters):
    """Equal-weight blend of last ≤3 bigram rows (mirrors JS getMarkovLetter forward pass)."""
    recent = history[-3:]
    n = len(recent)
    blended = {l: 0.0 for l in letters}
    for prev in recent:
        row = bigrams.get(prev, {})
        for l in letters:
            blended[l] += row.get(l, 0.0) / n
    return blended


def backwards_blend(blended, last_letter, reverse_bigrams, letters):
    """
    Multiply in the reverse-bigram signal from the most recent letter.
    reverse_bigrams[N][last_letter] = P(last_letter preceded N).
    Mirrors JS backwardsBlend().
    """
    if not last_letter:
        return blended
    result = {}
    for l in letters:
        rev_row = reverse_bigrams.get(l, {})
        result[l] = blended[l] * (rev_row.get(last_letter, EPSILON))
    return result


def get_markov_letter(history, data, letters):
    """
    Generate the next letter given recent history.
    Falls back to start distribution when history is empty.
    Mirrors JS getMarkovLetter().
    """
    if not history:
        return sample(data["start"], letters)

    last_letter = history[-1]

    blended = forward_blend(history, data["bigrams"], letters)
    blended = backwards_blend(blended, last_letter, data["reverse_bigrams"], letters)

    return sample(blended, letters)


def get_consonant_run(sequence):
    """Return the number of trailing consonants in the sequence."""
    count = 0
    for ch in reversed(sequence):
        if ch in VOWELS:
            break
        count += 1
    return count


def generate_sequence(length, data, letters):
    """
    Generate a letter sequence of the given length applying heuristics:
      - No consecutive identical letters
      - Vowel forced after 4 consecutive consonants
    Mirrors JS generateLetterSequence() / getNextValidLetter().
    """
    sequence = []

    for _ in range(length):
        history = sequence[-3:]
        prev = sequence[-1] if sequence else None
        must_be_vowel = get_consonant_run(sequence) >= 4

        letter = None
        for _ in range(100):
            candidate = get_markov_letter(history, data, letters)
            if candidate == prev:
                continue
            if must_be_vowel and candidate not in VOWELS:
                continue
            letter = candidate
            break

        if letter is None:
            # Forced fallback
            if must_be_vowel:
                options = [v for v in VOWELS if v != prev]
            else:
                options = [c for c in letters if c not in VOWELS and c != prev]
            letter = random.choice(options)

        sequence.append(letter)

    return sequence


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    base_dir = os.path.dirname(script_dir)

    print("Loading dictionary frequencies...")
    dict_freq = load_dict_freq(base_dir)

    print(f"Loading Markov data from {MARKOV_JSON}...")
    with open(os.path.join(base_dir, MARKOV_JSON), encoding="utf-8") as f:
        data = json.load(f)

    letters = list(LETTERS)

    print(f"Running {NUM_TRIALS} trials × {SEQUENCE_LENGTH} letters ({NUM_TRIALS * SEQUENCE_LENGTH:,} total)...")
    gen_counts = defaultdict(int)
    for _ in range(NUM_TRIALS):
        for ch in generate_sequence(SEQUENCE_LENGTH, data, letters):
            gen_counts[ch] += 1

    total_gen = sum(gen_counts.values())
    gen_freq = {l: gen_counts[l] / total_gen for l in LETTERS}

    # Sort by absolute difference descending
    diffs = [(l, dict_freq[l], gen_freq[l], gen_freq[l] - dict_freq[l]) for l in LETTERS]
    diffs.sort(key=lambda x: abs(x[3]), reverse=True)

    print()
    print(f"{'Letter':<8} {'Dict %':>8} {'Gen %':>8} {'Diff':>8}")
    print("-" * 36)
    for letter, d_pct, g_pct, diff in diffs:
        flag = " *" if abs(diff) > 0.02 else ""
        print(f"{letter:<8} {d_pct*100:>7.2f}% {g_pct*100:>7.2f}% {diff*100:>+7.2f}%{flag}")

    lines = []
    flagged = [l for l, _, _, d in diffs if abs(d) > 0.02]
    if flagged:
        lines.append(f"* Letters with |diff| > 2%: {', '.join(flagged)}")
    else:
        lines.append("All letters within 2% of dictionary frequency.")

    print()
    for line in lines:
        print(line)

    output_path = os.path.join(base_dir, "scripts", "output", "letter_frequency.txt")
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as out:
        out.write(f"{'Letter':<8} {'Dict %':>8} {'Gen %':>8} {'Diff':>8}\n")
        out.write("-" * 36 + "\n")
        for letter, d_pct, g_pct, diff in diffs:
            flag = " *" if abs(diff) > 0.02 else ""
            out.write(f"{letter:<8} {d_pct*100:>7.2f}% {g_pct*100:>7.2f}% {diff*100:>+7.2f}%{flag}\n")
        out.write("\n")
        for line in lines:
            out.write(line + "\n")
    print(f"\nResults written to {output_path}")


if __name__ == "__main__":
    main()
