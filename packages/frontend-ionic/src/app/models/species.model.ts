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
  images?: SpeciesImage[];
  type: SpeciesType;
}

export interface SpeciesGroup {
  name: string;
  items: Species[];
}

export interface Bird extends BaseSpecies {
  type: SpeciesType.Bird;
  orderId: number;
  order?: SpeciesOrder;
}

export interface Plant extends BaseSpecies {
  type: SpeciesType.Plant;
  categoryId: number;
  category?: SpeciesCategory;
}

export interface SpeciesImage {
  fileName: string;
  caption: string;
  sortOrder: number;
}

export interface SpeciesOrder {
  nameScientific: string;
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
    nameLocal: row.species_name_local,
    nameScientific: row.species_name_scientific,
    nameEn: row.species_name_en,
    nameMeaningEn: row.species_name_meaning_en,
    descriptionLocal: row.species_description_local,
    descriptionEn: row.species_description_en,
    orderId: row.species_order_id,
    mapImage: row.species_map_image,
  };
}

export function mapPlant(row: any): Plant {
  return {
    type: SpeciesType.Plant,
    id: row.species_id,
    nameLocal: row.species_name_local,
    nameScientific: row.species_name_scientific,
    nameEn: row.species_name_en,
    nameMeaningEn: row.species_name_meaning_en,
    descriptionLocal: row.species_description_local,
    descriptionEn: row.species_description_en,
    categoryId: row.category_id,
    mapImage: row.species_map_image,
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
          (speciesMap[speciesId] as any).orderId = row.order_id;
          (speciesMap[speciesId] as any).order = {
            nameScientific: row.order_name_scientific,
            descriptionEn: row.order_description_en,
            descriptionLocal: row.order_description_local,
          };
          break;
        case SpeciesType.Plant:
          speciesMap[speciesId] = mapPlant(row);
          speciesMap[speciesId].images = [];
          (speciesMap[speciesId] as any).categoryId = row.category_id;
          (speciesMap[speciesId] as any).category = {
            name: row.category_name,
            descriptionEn: row.category_description_en,
            descriptionLocal: row.category_description_local,
          };
          break;
      }
    }
    if (row.image_file_name) {
      speciesMap[speciesId].images?.push({
        fileName: row.image_file_name,
        caption: row.image_caption,
        sortOrder: row.image_sort_order,
      });
    }
  });

  Object.values(speciesMap).forEach((species) => {
    species.images?.sort((a, b) => a.sortOrder - b.sortOrder);
  });

  return Object.values(speciesMap);
}
