/**
 * This file contains the constants for the plant options.
 */

import { ConfigService } from 'app/services/config.service';

const languageLabel = (language: string) => {
  return language.charAt(0).toUpperCase() + language.slice(1);
};

export type PlantSortOption =
  | 'alphabetical-local'
  | 'alphabetical-english'
  | 'alphabetical-latin'
  | 'by-category';
export type LanguageOption = 'local' | 'english';
export type SortDirection = 'ascending' | 'descending';

export function getPlantSortOptions(
  configService: ConfigService
): { value: PlantSortOption; label: string }[] {
  const languageName = languageLabel(configService.get<string>('language') ?? 'Local');

  return [
    {
      value: 'alphabetical-local',
      label: `${languageName}`,
    },
    { value: 'alphabetical-english', label: 'English' },
    { value: 'alphabetical-latin', label: 'Latin' },
    { value: 'by-category', label: 'Category' },
  ];
}

export const SORT_DIRECTION_OPTIONS: { value: SortDirection; label: string }[] = [
  { value: 'ascending', label: 'Ascending' },
  { value: 'descending', label: 'Descending' },
];

export const PLANT_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'All' },
];
