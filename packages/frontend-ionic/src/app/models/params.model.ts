import { Species, SpeciesType } from 'app/models/species.model';

export interface Params {
  speciesType: SpeciesType;
  species?: Species;
  sortOrder: 'nameScientific' | 'nameEn' | 'nameLocal' | 'order' | 'size';
  enableSearch: boolean;
}

export interface Filter {
  searchTerm: string;
  orderId?: number;
}
