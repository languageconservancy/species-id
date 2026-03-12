import { TestBed } from '@angular/core/testing';

import { FuzzySearchService } from './fuzzy-search.service';

describe('FuzzySearchService', () => {
  let service: FuzzySearchService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FuzzySearchService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('approximate()', () => {
    it('lowercases and strips diacritics (Crow vowels)', () => {
      expect(service.approximate('Bííle')).toBe('biile');
      expect(service.approximate('á')).toBe('a');
      expect(service.approximate('ÚÚ')).toBe('uu');
    });

    it('collapses repeated vowels', () => {
      expect(service.approximate('baaa')).toBe('ba');
      expect(service.approximate('ee')).toBe('e');
    });

    it('collapses repeated consonants', () => {
      expect(service.approximate('xxx')).toBe('h');
      expect(service.approximate('kkk')).toBe('k');
    });

    it('normalizes phonetically: x→h, j→ch, r→l, q→k, g→k, z→s', () => {
      expect(service.approximate('x')).toBe('h');
      expect(service.approximate('j')).toBe('ch');
      expect(service.approximate('run')).toBe('lun');
      expect(service.approximate('queen')).toBe('kueen');
      expect(service.approximate('go')).toBe('ko');
      expect(service.approximate('zoo')).toBe('soo');
    });

    it('removes spaces', () => {
      expect(service.approximate('a b c')).toBe('abc');
    });

    it('strips hyphens and apostrophes', () => {
      expect(service.approximate("báa'e")).not.toContain("'");
      expect(service.approximate('bi-le')).not.toContain('-');
    });

    it('strips common Crow affixes for words longer than 8 chars', () => {
      const longWithAffix = 'baleachiilachi'; // > 8 chars, has ^bale and lichi$
      const result = service.approximate(longWithAffix);
      expect(result.length).toBeLessThan(longWithAffix.length);
    });
  });

  describe('matches()', () => {
    it('returns true when target contains query after normalization', () => {
      expect(service.matches('bile', 'Bííle')).toBe(true);
      expect(service.matches('bil', 'Bííle')).toBe(true);
      expect(service.matches('scientific', 'Name Scientific')).toBe(true);
    });

    it('returns false when normalized target does not contain normalized query', () => {
      expect(service.matches('xyz', 'Bííle')).toBe(false);
      expect(service.matches('dog', 'cat')).toBe(false);
    });

    it('matches despite diacritics and case', () => {
      expect(service.matches('bííle', 'BIILE')).toBe(true);
      expect(service.matches('BÍÍLE', 'biile')).toBe(true);
    });

    it('matches phonetically similar spellings', () => {
      expect(service.matches('hil', 'xil')).toBe(true); // x→h so "xil" → "hil"
      expect(service.matches('lun', 'run')).toBe(true); // r→l so "run" → "lun"
      expect(service.matches('ko', 'go')).toBe(true); // g→k so "go" → "ko"
    });
  });

  describe('filter()', () => {
    const items = [
      { id: 1, name: 'Bííle' },
      { id: 2, name: 'Cat' },
      { id: 3, name: 'Doggie' },
    ];

    it('returns all items when query is empty or whitespace', () => {
      expect(service.filter(items, '', (i) => i.name)).toEqual(items);
      expect(service.filter(items, '   ', (i) => i.name)).toEqual(items);
    });

    it('returns only items whose extracted text fuzzy-matches the query', () => {
      const result = service.filter(items, 'bile', (i) => i.name);
      expect(result.length).toBe(1);
      expect(result[0].name).toBe('Bííle');
    });

    it('returns multiple items when multiple match', () => {
      const many = [{ name: 'bat' }, { name: 'batch' }, { name: 'cat' }];
      const result = service.filter(many, 'at', (i) => i.name);
      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result.map((i) => i.name)).toContain('bat');
      expect(result.map((i) => i.name)).toContain('batch');
      expect(result.map((i) => i.name)).toContain('cat');
    });

    it('returns empty array when no items match', () => {
      const result = service.filter(items, 'xyz', (i) => i.name);
      expect(result).toEqual([]);
    });
  });
});
