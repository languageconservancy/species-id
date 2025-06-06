import { Injectable } from '@angular/core';
import { Params } from 'app/models/params.model';
import { SpeciesType } from 'app/models/species.model';

@Injectable({
  providedIn: 'root',
})
export class ParamsService {
  private _params: Params = {
    speciesType: SpeciesType.Bird, // Default species type
    species: undefined, // Initially no species selected
    sortOrder: 'nameLocal', // Default sort order
    enableSearch: false, // Search is disabled by default
  };

  constructor() {}

  getParams(): Params {
    return this._params;
  }

  setParams(params: Partial<Params>): void {
    this._params = { ...this._params, ...params };
  }
}
