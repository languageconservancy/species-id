import { Injectable } from '@angular/core';
import { BasePreferencesService } from 'app/services/base-preferences.service';
import { BirdPreferencesService } from 'app/services/bird-preferences.service';
import { PlantPreferencesService } from 'app/services/plant-preferences.service';
import { SpeciesType } from 'app/models/species.model';

@Injectable({
  providedIn: 'root',
})
export class PreferencesFactory {
  constructor(
    private birdPreferences: BirdPreferencesService,
    private plantPreferences: PlantPreferencesService
  ) {}

  getPreferencesService(domain: SpeciesType): BasePreferencesService {
    switch (domain) {
      case SpeciesType.Bird:
        return this.birdPreferences;
      case SpeciesType.Plant:
        return this.plantPreferences;
      default:
        throw new Error(`Unknown domain type: ${domain}`);
    }
  }
}
