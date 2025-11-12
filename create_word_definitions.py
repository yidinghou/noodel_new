#!/usr/bin/env python3
"""
Enhanced script to create comprehensive CSV files with words and definitions using multiple NLTK sources.
Includes stopwords with custom definitions for common function words.
"""

import csv
import nltk
from nltk.corpus import wordnet as wn
from nltk.corpus import words
from nltk.corpus import stopwords
import random

def download_required_data():
    """Download required NLTK data."""
    corpora_to_download = [
        ('wordnet', 'WordNet'),
        ('words', 'Words corpus'), 
        ('stopwords', 'Stopwords'),
        ('brown', 'Brown corpus')
    ]
    
    for corpus_name, display_name in corpora_to_download:
        try:
            nltk.data.find(f'corpora/{corpus_name}')
            print(f"{display_name} already downloaded")
        except LookupError:
            print(f"Downloading {display_name}...")
            nltk.download(corpus_name)

def get_word_definition(word):
    """
    Get the best definition for a word using WordNet.
    Returns None if no definition is found - caller can decide to keep blank or skip.
    """
    # Try WordNet
    synsets = wn.synsets(word)
    if synsets:
        return synsets[0].definition()
    
    # Return None if no definition found
    return None

def clean_word(word):
    """Clean and validate a word."""
    word = word.lower().strip()
    # Only keep words with alphabetic characters
    if word.isalpha() and len(word) >= 3:
        return word
    return None

def get_comprehensive_word_list(target_length=None, include_stopwords=True):
    """
    Get a comprehensive list of words from multiple sources.
    
    Args:
        target_length (int, optional): Filter by specific word length
        include_stopwords (bool): Whether to include common stopwords
    
    Returns:
        list: List of unique words
    """
    all_words = set()
    
    # Get words from NLTK words corpus
    try:
        english_words = set(words.words())
        all_words.update([word.lower() for word in english_words if word.isalpha()])
        print(f"Added {len(english_words)} words from NLTK words corpus")
    except Exception as e:
        print(f"Error accessing words corpus: {e}")
    
    # Add stopwords if requested
    if include_stopwords:
        try:
            english_stopwords = set(stopwords.words('english'))
            # Filter stopwords by length if specified
            if target_length:
                stopwords_filtered = [word for word in english_stopwords if len(word) == target_length]
            else:
                stopwords_filtered = list(english_stopwords)
            all_words.update(stopwords_filtered)
            print(f"Added {len(stopwords_filtered)} stopwords")
        except Exception as e:
            print(f"Error accessing stopwords: {e}")
    
    # Note: Custom definitions removed - using only NLTK sources
    
    # Filter by target length if specified
    if target_length:
        all_words = {word for word in all_words if len(word) == target_length}
    
    return list(all_words)

def create_enhanced_words_by_length_csv(target_length):
    """
    Create a CSV for words of a specific length using enhanced word sources.
    Includes ALL words of the specified length.
    
    Args:
        target_length (int): The target word length (3-8)
    
    Returns:
        int: Number of word-definition pairs created
    """
    filename = f"{target_length}_letter_words.csv"
    print(f"Creating enhanced {filename} for ALL {target_length}-letter words...")
    
    # Get comprehensive word list
    word_list = get_comprehensive_word_list(target_length=target_length)
    
    # Get stopwords for comparison
    try:
        english_stopwords = set(stopwords.words('english'))
    except Exception:
        english_stopwords = set()
    
    # Separate stopwords and regular words to prioritize stopwords
    stopwords_list = [word for word in word_list if word in english_stopwords]
    regular_words_list = [word for word in word_list if word not in english_stopwords]
    
    # Shuffle regular words but keep stopwords first
    random.shuffle(regular_words_list)
    
    # Combine: stopwords first, then regular words
    prioritized_word_list = stopwords_list + regular_words_list
    
    word_definitions = []
    processed = 0
    
    for word in prioritized_word_list:
        cleaned_word = clean_word(word)
        if cleaned_word and len(cleaned_word) == target_length:
            definition = get_word_definition(cleaned_word)
            
            # Always keep stopwords (even with blank definitions)
            # For other words, only keep if they have a definition
            if cleaned_word in english_stopwords:
                word_definitions.append((cleaned_word, definition or ""))
                processed += 1
            elif definition:  # Non-stopwords need a definition
                word_definitions.append((cleaned_word, definition))
                processed += 1
            
            if processed % 100 == 0:
                print(f"  Processed {processed} {target_length}-letter words...")
    
    # Sort alphabetically
    word_definitions.sort(key=lambda x: x[0])
    
    # Write to CSV
    with open(filename, 'w', newline='', encoding='utf-8') as csvfile:
        writer = csv.writer(csvfile)
        # Write header
        writer.writerow(['word', 'definition'])
        # Write data
        writer.writerows(word_definitions)
    
    print(f"  Created {filename} with {len(word_definitions)} word-definition pairs")
    return len(word_definitions)


def main():
    """Main function to create enhanced word definition CSV files."""
    print("Enhanced Word Definition CSV Generator using NLTK")
    print("=" * 60)
    
    # Download required NLTK data
    download_required_data()
    
    print("\nGenerating enhanced CSV files...")
        
    # Create enhanced length-specific files
    print("\nCreating enhanced length-specific files...")
    length_results = {}
    for length in range(3, 8):
        count = create_enhanced_words_by_length_csv(length)
        length_results[length] = count
    
    print("\nGeneration complete!")
    print("- Enhanced individual length files:")
    for length, count in length_results.items():
        print(f"  {length}-letter words: {count} entries in '{length}_letter_words_enhanced.csv'")

if __name__ == "__main__":
    main()