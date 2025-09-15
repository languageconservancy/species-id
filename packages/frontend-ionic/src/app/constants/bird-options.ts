/**
 * This file contains the constants for the bird options.
 */

import { ConfigService } from 'app/services/config.service';

const languageLabel = (language: string) => {
  return language.charAt(0).toUpperCase() + language.slice(1);
};

export type BirdSortOption =
  | 'alphabetical-local'
  | 'alphabetical-english'
  | 'alphabetical-scientific'
  | 'by-order';
export type LanguageOption = 'local' | 'english';
export type SortDirection = 'ascending' | 'descending';

export function getBirdSortOptions(
  configService: ConfigService
): { value: BirdSortOption; label: string }[] {
  const languageName = languageLabel(configService.get<string>('language') ?? 'Local');

  return [
    {
      value: 'alphabetical-local',
      label: `Alphabetical (${languageName})`,
    },
    { value: 'alphabetical-english', label: 'Alphabetical (English)' },
    { value: 'alphabetical-scientific', label: 'Alphabetical (Scientific)' },
    { value: 'by-order', label: 'By Order' },
  ];
}

export const SORT_DIRECTION_OPTIONS: { value: SortDirection; label: string }[] = [
  { value: 'ascending', label: 'Ascending' },
  { value: 'descending', label: 'Descending' },
];

export const BIRD_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'All' },
];
