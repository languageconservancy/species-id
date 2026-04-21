export enum SpeciesType {
  Bird = 'bird',
  Plant = 'plant',
}

export type Species = Bird | Plant;

export interface BaseSpecies {
  id: number;
  nameLocal: string;
  nameScientific: string;
  nameEn: string;
  nameMeaningEn: string;
  descriptionLocal: string;
  descriptionEn: string;
  mapImage: string;
  category: string;
  images?: SpeciesImage[];
  type: SpeciesType;
  /** Set on explore list rows when multiple adjacent DB rows were merged for display. */
  mergedLocalNamesDisplay?: string;
}

export interface SpeciesGroup {
  name: string;
  items: Species[];
}

export interface Bird extends BaseSpecies {
  type: SpeciesType.Bird;
  habitatEn?: string;
  foodHabitsEn?: string;
  migrationEn?: string;
  culturalEn?: string;
}

export interface Plant extends BaseSpecies {
  type: SpeciesType.Plant;
  habitatEn?: string;
  usesEn?: string;
}

export interface SpeciesImage {
  fileName: string;
  caption: string;
  credit: string;
  sortOrder: number;
}

export interface SpeciesOrder {
  namesScientific: string[];
  descriptionEn: string;
  descriptionLocal: string;
}

export interface SpeciesCategory {
  name: string;
  descriptionEn: string;
  descriptionLocal: string;
}

export function mapSpecies(row: any, kind: 'bird' | 'plant'): Species {
  if (kind === 'bird') {
    return mapBird(row);
  } else {
    return mapPlant(row);
  }
}

export function mapBird(row: any): Bird {
  return {
    type: SpeciesType.Bird,
    id: row.species_id,
    nameLocal: row.species_name_local || '',
    nameScientific: row.species_name_scientific || '',
    nameEn: row.species_name_en || '',
    nameMeaningEn: row.species_name_meaning_en || '',
    descriptionLocal: row.species_description_local || '',
    descriptionEn: row.species_description_en || '',
    category: row.species_category || '',
    habitatEn: row.species_habitat_en || '',
    foodHabitsEn: row.species_food_habits_en || '',
    migrationEn: row.species_migration_en || '',
    culturalEn: row.species_cultural_en || '',
    mapImage: row.species_map_image || '',
  };
}

export function mapPlant(row: any): Plant {
  return {
    type: SpeciesType.Plant,
    id: row.species_id,
    nameLocal: row.species_name_local || '',
    nameScientific: row.species_name_scientific || '',
    nameEn: row.species_name_en || '',
    nameMeaningEn: row.species_name_meaning_en || '',
    descriptionLocal: row.species_description_local || '',
    descriptionEn: row.species_description_en || '',
    category: row.species_category || '',
    habitatEn: row.species_habitat_en || '',
    usesEn: row.species_uses_en || '',
    mapImage: row.species_map_image || '',
  };
}

export function mapSpeciesWithImagesAndOrder(result: any): Species[] {
  // SQL.js returns { values: any[][], columns: string[] }
  // We need to convert the array of arrays to array of objects
  const { values, columns } = result;

  if (!values || values.length === 0) {
    return [];
  }

  // Convert array of arrays to array of objects
  const rows = values.map((row: any[]) => {
    const obj: any = {};
    columns.forEach((column: string, index: number) => {
      obj[column] = row[index];
    });
    return obj;
  });

  const speciesMap: Record<number, Species> = {};

  rows.forEach((row: any) => {
    const speciesId = row.species_id;
    if (!speciesMap[speciesId]) {
      switch (row.species_type) {
        case SpeciesType.Bird:
          speciesMap[speciesId] = mapBird(row);
          speciesMap[speciesId].images = [];
          break;
        case SpeciesType.Plant:
          speciesMap[speciesId] = mapPlant(row);
          speciesMap[speciesId].images = [];
          break;
      }
    }
    if (row.image_file_name) {
      speciesMap[speciesId].images?.push({
        fileName: row.image_file_name,
        caption: row.image_caption || '',
        credit: row.image_credit || '',
        sortOrder: row.image_sort_order || 0,
      });
    }
  });

  Object.values(speciesMap).forEach((species) => {
    species.images?.sort((a, b) => a.sortOrder - b.sortOrder);
  });

  return Object.values(speciesMap);
}

export function mapSpeciesForList(result: any): Species[] {
  // SQL.js returns { values: any[][], columns: string[] }
  // For list view, we want each row to be a separate list item (no deduplication by species_id)
  const { values, columns } = result;

  if (!values || values.length === 0) {
    return [];
  }

  // Convert array of arrays to array of objects
  const rows = values.map((row: any[]) => {
    const obj: any = {};
    columns.forEach((column: string, index: number) => {
      obj[column] = row[index];
    });
    return obj;
  });

  // Map each row to a Species object (no deduplication)
  return rows.map((row: any) => {
    let species: Species;
    switch (row.species_type) {
      case SpeciesType.Bird:
        species = mapBird(row);
        break;
      case SpeciesType.Plant:
        species = mapPlant(row);
        break;
      default:
        throw new Error(`Unknown species type: ${row.species_type}`);
    }

    // Add images if present
    species.images = [];
    if (row.image_file_name) {
      species.images.push({
        fileName: row.image_file_name,
        caption: row.image_caption || '',
        credit: row.image_credit || '',
        sortOrder: row.image_sort_order || 0,
      });
    }

    return species;
  });
}
