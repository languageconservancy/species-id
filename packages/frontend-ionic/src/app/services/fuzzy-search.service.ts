import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class FuzzySearchService {
  private vowelReplacements: Record<string, string> = {
    á: 'a',
    ú: 'u',
    í: 'i',
    ó: 'o',
    é: 'e',
    '\u0323': '', // combining dot below
    '\u0027': '', // apostrophe
    '\u005c': '', // backslash
    '\u0302': '', // combining circumflex
    '\u005d': '', // right bracket
    '\u0301': '', // combining acute accent
    '\u005b': '', // left bracket
    '\u0300': '', // combining grave accent
    '\u0028': '', // left paren
    '\u0029': '', // right paren
    '-': '',
  };

  private vowelPattern = /[áúíóé\u0323\u0027\u005c\u0302\u005d\u0301\u005b\u0300\u0028\u0029-]/g;
  private affixPattern = /^bale|^ak|^ii|^baa|aachi$|lichi$|[km]$|sh$/g;

  /**
   * Creates a normalized/approximate version of a string for fuzzy matching.
   * Handles Crow language phonetics - strips diacritics, collapses repeated
   * letters, and normalizes phonetically similar sounds.
   */
  approximate(str: string): string {
    let result = str.toLowerCase().replace(this.vowelPattern, (c) => {
      return this.vowelReplacements[c] ?? c;
    });

    // Strip common affixes for longer words
    if (str.length > 8) {
      result = result.replace(this.affixPattern, '');
    }

    // Collapse repeated letters and normalize phonetically similar sounds
    result = result
      .replace(/([aeiou])\1+/g, '$1') // collapse repeated vowels
      .replace(/([xtsmnhpk])\1+/g, '$1') // collapse repeated consonants
      .replace(/x/g, 'h')
      .replace(/h([qwrtypsdfgjklzxcvbnm])/g, '$1') // remove h before consonants
      .replace(/[stx]ch/g, 'ch')
      .replace(/j/g, 'ch')
      .replace(/r/g, 'l')
      .replace(/q/g, 'k')
      .replace(/ph/g, 'b')
      .replace(/th/g, 't')
      .replace(/sh/g, 's')
      .replace(/ch/g, 't')
      .replace(/gy/g, 'k')
      .replace(/y/g, 'i')
      .replace(/[wmp]/g, 'b')
      .replace(/[nl]/g, 'd')
      .replace(/g/g, 'k')
      .replace(/z/g, 's')
      .replace(/ /g, '');

    return result;
  }

  /**
   * Check if a search query fuzzy-matches a target string.
   */
  matches(query: string, target: string): boolean {
    const normalizedQuery = this.approximate(query);
    const normalizedTarget = this.approximate(target);
    return normalizedTarget.includes(normalizedQuery);
  }

  /**
   * Filter an array of items by fuzzy-matching against a text field.
   */
  filter<T>(items: T[], query: string, textExtractor: (item: T) => string): T[] {
    if (!query.trim()) {
      return items;
    }
    const normalizedQuery = this.approximate(query);
    return items.filter((item) => {
      const text = textExtractor(item);
      const normalizedText = this.approximate(text);
      return normalizedText.includes(normalizedQuery);
    });
  }
}
