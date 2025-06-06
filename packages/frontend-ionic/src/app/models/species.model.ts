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
  images?: SpeciesImage[];
  type: SpeciesType;
  orderId: number;
  order?: SpeciesOrder;
}

export interface Bird extends BaseSpecies {
  type: SpeciesType.Bird;
}

export interface Plant extends BaseSpecies {
  type: SpeciesType.Plant;
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
    id: row.id,
    nameLocal: row.name_local,
    nameScientific: row.name_scientific,
    nameEn: row.name_en,
    nameMeaningEn: row.name_meaning_en,
    descriptionLocal: row.description_local,
    descriptionEn: row.description_en,
    orderId: row.order_id,
  };
}

export function mapPlant(row: any): Plant {
  return {
    type: SpeciesType.Plant,
    id: row.id,
    nameLocal: row.name_local,
    nameScientific: row.name_scientific,
    nameEn: row.name_en,
    nameMeaningEn: row.name_meaning_en,
    descriptionLocal: row.description_local,
    descriptionEn: row.description_en,
    orderId: row.order_id,
  };
}

export function mapSpeciesWithImagesAndOrder(rows: any[]): Species[] {
  const speciesMap: Record<number, Species> = {};

  rows.forEach((row) => {
    const speciesId = row.id;
    if (!speciesMap[speciesId]) {
      speciesMap[speciesId] = mapBird(row);
      speciesMap[speciesId].images = [];
      speciesMap[speciesId].order = {
        nameScientific: row.order_name_scientific,
        descriptionEn: row.order_description_en,
        descriptionLocal: row.order_description_local,
      };
    }
    if (row.file_name) {
      speciesMap[speciesId].images?.push({
        fileName: row.file_name,
        caption: row.caption,
        sortOrder: row.sort_order,
      });
    }
    speciesMap[speciesId].images?.sort((a, b) => a.sortOrder - b.sortOrder);
  });

  return Object.values(speciesMap);
}
