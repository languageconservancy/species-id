import { Injectable } from '@angular/core';

/**
 * Search matching for species explore lists. Two separate fuzzy strategies:
 *
 * 1. Crow (nameLocal) — phonetic normalization via {@link approximate} + substring
 *    check in {@link matches}. Collapses spelling variants (diacritics, similar sounds).
 *
 * 2. English/Latin (nameEn, scientific, meaning) — light text normalization via
 *    {@link approximateEnglish}, then typo tolerance via {@link matchesEnglish} using
 *    prefix matching and Levenshtein edit distance (not Crow phonetics).
 *
 * Exact-match tier uses {@link includesExactMatch} for Crow and
 * {@link includesEnglishMatch} for English/Latin fields.
 */
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

  /** All apostrophe-like characters (Unicode variants) normalized to empty string for search. */
  private apostrophePattern = /[\u0027\u2018\u2019\u201B\u02BC\u02B9\u0060]/g;

  normalizeApostrophes(str: string): string {
    return str.replace(this.apostrophePattern, '\u0027');
  }

  normalizeVowels(str: string): string {
    return str.toLowerCase().replace(this.vowelPattern, (c) => {
      return this.vowelReplacements[c] ?? c;
    });
  }

  normalizeAffixes(str: string): string {
    return str.replace(this.affixPattern, '');
  }

  normalizeRepeatedLetters(str: string): string {
    return str.replace(/([aeiou])\1+/g, '$1').replace(/([xtsmnhpk])\1+/g, '$1');
  }

  /** Exact substring match for Crow names; only normalizes apostrophes and case. */
  includesExactMatch(query: string, target: string): boolean {
    const normalizedQuery = this.normalizeApostrophes(query.toLowerCase());
    const normalizedTarget = this.normalizeApostrophes(target.toLowerCase());
    return normalizedTarget.includes(normalizedQuery);
  }

  /**
   * Normalizes English/Latin text for substring search: lowercase, strip accents,
   * unify apostrophes, and treat hyphens as word separators.
   */
  approximateEnglish(str: string): string {
    let result = this.normalizeApostrophes(str).toLowerCase();
    // Decompose accented letters (NFD), then drop combining marks so "é" and "e" match.
    result = result.normalize('NFD').replace(/\p{M}/gu, '');
    // Treat hyphens and slashes as word breaks so "red-tailed" matches "red tailed".
    result = result.replace(/[-/]/g, ' ');
    // Strip remaining punctuation (parens, commas, etc.); keep letters, digits, and spaces.
    result = result.replace(/[^\p{L}\p{N}\s]/gu, ' ');
    return result.replace(/\s+/g, ' ').trim();
  }

  /** Exact substring match for English/Latin fields after {@link approximateEnglish}. */
  includesEnglishMatch(query: string, target: string): boolean {
    const normalizedQuery = this.approximateEnglish(query);
    const normalizedTarget = this.approximateEnglish(target);
    if (!normalizedQuery || !normalizedTarget) {
      return false;
    }
    return normalizedTarget.includes(normalizedQuery);
  }

  /**
   * Creates a normalized/approximate version of a string for fuzzy matching.
   * Handles Crow language phonetics - strips diacritics, collapses repeated
   * letters, and normalizes phonetically similar sounds.
   */
  approximate(str: string): string {
    // Normalize apostrophes (straight, curly, modifier letter, etc.) so search matches regardless of which is used
    let result = this.normalizeApostrophes(str);
    result = this.normalizeVowels(result);

    // Remove common affixes for longer words
    if (str.length > 8) {
      result = this.normalizeAffixes(result);
    }

    // Collapse repeated letters
    result = this.normalizeRepeatedLetters(result);

    // Map Crow phonetically similar consonants/vowels to a shared form, then strip spaces.
    // This is intentionally aggressive — English text must use matchesEnglish() instead.
    result = result
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
   * Crow near-match: phonetically normalize both strings, then check substring inclusion.
   * Used for "Near Matches" on Crow names only — do not use for English text.
   */
  matches(query: string, target: string): boolean {
    const normalizedQuery = this.approximate(query.toLowerCase());
    const normalizedTarget = this.approximate(target.toLowerCase());
    return normalizedTarget.includes(normalizedQuery);
  }

  /**
   * English/Latin near-match: normalize text, then allow typos via edit distance.
   * Each query word must match a target word (or fuzzy substring within one) within
   * the Levenshtein threshold — e.g. "robn" → "robin", "woad" → "wood" (1 edit).
   */
  matchesEnglish(query: string, target: string): boolean {
    const normalizedQuery = this.approximateEnglish(query);
    const normalizedTarget = this.approximateEnglish(target);
    if (!normalizedQuery || !normalizedTarget) {
      return false;
    }

    // Normalized substring still counts as a near match (hyphen/space variants).
    if (normalizedTarget.includes(normalizedQuery)) {
      return true;
    }

    const queryWords = normalizedQuery.split(' ').filter((word) => word.length > 0);
    if (queryWords.length === 0) {
      return false;
    }

    const targetWords = normalizedTarget.split(' ').filter((word) => word.length > 0);
    // Multi-word queries: every word must fuzzy-match somewhere in the target.
    return queryWords.every(
      (queryWord) =>
        this.hasFuzzyEnglishWordMatch(queryWord, targetWords) ||
        this.hasFuzzyEnglishSubstring(normalizedTarget, queryWord)
    );
  }

  /** True if queryWord fuzzy-matches any whole word in the target. */
  private hasFuzzyEnglishWordMatch(queryWord: string, targetWords: string[]): boolean {
    return targetWords.some((targetWord) => this.isFuzzyEnglishWordMatch(queryWord, targetWord));
  }

  /**
   * Word-level English fuzzy match: exact, prefix (partial typing), or Levenshtein.
   * Words under 3 chars skip edit distance to limit false positives (e.g. "cat").
   */
  private isFuzzyEnglishWordMatch(queryWord: string, targetWord: string): boolean {
    if (queryWord === targetWord) {
      return true;
    }
    if (queryWord.length >= 3 && targetWord.startsWith(queryWord)) {
      return true;
    }
    if (queryWord.length < 3) {
      return false;
    }

    const maxDistance = queryWord.length <= 6 ? 1 : 2;
    return this.levenshtein(queryWord, targetWord) <= maxDistance;
  }

  /**
   * Slide a window across target words so typos can match inside longer tokens
   * (e.g. query "eagel" against target word "eagle").
   */
  private hasFuzzyEnglishSubstring(target: string, queryWord: string): boolean {
    if (queryWord.length < 4) {
      return false;
    }

    const targetWords = target.split(' ').filter((word) => word.length > 0);
    for (const targetWord of targetWords) {
      if (targetWord.length < queryWord.length) {
        continue;
      }
      for (let index = 0; index <= targetWord.length - queryWord.length; index++) {
        const slice = targetWord.slice(index, index + queryWord.length);
        if (this.isFuzzyEnglishWordMatch(queryWord, slice)) {
          return true;
        }
      }
    }
    return false;
  }

  /** Minimum number of single-character insert/delete/substitute edits between two strings. */
  private levenshtein(a: string, b: string): number {
    if (a === b) {
      return 0;
    }
    if (a.length === 0) {
      return b.length;
    }
    if (b.length === 0) {
      return a.length;
    }

    const previous = new Array<number>(b.length + 1);
    const current = new Array<number>(b.length + 1);

    for (let j = 0; j <= b.length; j++) {
      previous[j] = j;
    }

    for (let i = 1; i <= a.length; i++) {
      current[0] = i;
      for (let j = 1; j <= b.length; j++) {
        const substitutionCost = a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1;
        current[j] = Math.min(
          previous[j] + 1,
          current[j - 1] + 1,
          previous[j - 1] + substitutionCost
        );
      }
      for (let j = 0; j <= b.length; j++) {
        previous[j] = current[j];
      }
    }

    return previous[b.length];
  }

  /**
   * Filter items using Crow phonetic fuzzy matching ({@link approximate} + substring).
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
