/**
 * This file contains the constants for the bird options.
 */

import { environment } from 'environments/environment';

const languageLabel = (language: string) => {
  return language.charAt(0).toUpperCase() + language.slice(1);
};

export type BirdSortOption = 'alphabetical-local' | 'alphabetical-english' | 'by-order';
export type BirdFilterOption = 'all' | 'endangered' | 'threatened' | 'migratory';
export type LanguageOption = 'local' | 'english';
export type SortDirection = 'ascending' | 'descending';

export const BIRD_SORT_OPTIONS: { value: BirdSortOption; label: string }[] = [
  {
    value: 'alphabetical-local',
    label: `Alphabetical (${languageLabel(environment.language ?? 'Local')})`,
  },
  { value: 'alphabetical-english', label: 'Alphabetical (English)' },
  { value: 'by-order', label: 'By Order' },
];

export const BIRD_FILTER_OPTIONS: { value: BirdFilterOption; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'endangered', label: 'Endangered' },
  { value: 'threatened', label: 'Threatened' },
  { value: 'migratory', label: 'Migratory' },
];

export const SORT_DIRECTION_OPTIONS: { value: SortDirection; label: string }[] = [
  { value: 'ascending', label: 'Ascending' },
  { value: 'descending', label: 'Descending' },
];
