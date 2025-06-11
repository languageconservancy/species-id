import { Species, SpeciesType } from 'app/models/species.model';

export interface Params {
  speciesType: SpeciesType;
  species?: Species;
  sortOrder: 'nameScientific' | 'nameEn' | 'nameLocal' | 'order';
}

export interface Filter {
  searchTerm: string;
  orderId?: number;
}
