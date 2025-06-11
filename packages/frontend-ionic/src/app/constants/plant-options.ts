import { environment } from 'environments/environment';

const languageLabel = (language: string) => {
  return language.charAt(0).toUpperCase() + language.slice(1);
};

export type PlantSortOption =
  | 'alphabetical-local'
  | 'alphabetical-english'
  | 'by-family'
  | 'by-height';
export type PlantFilterOption = 'all' | 'endangered' | 'threatened' | 'native' | 'invasive';
export type LanguageOption = 'local' | 'english';
export type SortDirection = 'ascending' | 'descending';

export const PLANT_SORT_OPTIONS: { value: PlantSortOption; label: string }[] = [
  {
    value: 'alphabetical-local',
    label: `Alphabetical (${languageLabel(environment.language ?? 'Local')})`,
  },
  { value: 'alphabetical-english', label: 'Alphabetical (English)' },
  { value: 'by-family', label: 'By Family' },
  { value: 'by-height', label: 'By Height' },
];

export const PLANT_FILTER_OPTIONS: { value: PlantFilterOption; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'endangered', label: 'Endangered' },
  { value: 'threatened', label: 'Threatened' },
  { value: 'native', label: 'Native' },
  { value: 'invasive', label: 'Invasive' },
];

export const SORT_DIRECTION_OPTIONS: { value: SortDirection; label: string }[] = [
  { value: 'ascending', label: 'Ascending' },
  { value: 'descending', label: 'Descending' },
];
