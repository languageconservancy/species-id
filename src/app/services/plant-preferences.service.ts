// plant-preferences.service.ts
import { Injectable } from '@angular/core';
import { StorageReadyService } from './storage-ready.service';
import { Storage } from '@ionic/storage-angular';
import {
  BasePreferencesService,
  FilterOption,
  SortOption,
} from 'app/services/base-preferences.service';
import { getPlantSortOptions, PLANT_FILTER_OPTIONS } from 'app/constants/plant-options';
import { ConfigService } from 'app/services/config.service';

@Injectable({ providedIn: 'root' })
export class PlantPreferencesService extends BasePreferencesService {
  protected readonly SORT_KEY = 'plantSort';
  protected readonly SORT_DIRECTION_KEY = 'plantSortDirection';
  protected readonly FILTERS_KEY = 'plantFilters';

  constructor(
    protected override storage: Storage,
    protected override storageReady: StorageReadyService,
    protected configService: ConfigService
  ) {
    console.log('PlantPreferencesService constructor');
    super(storage, storageReady);
  }

  getSortOptions(): SortOption[] {
    return getPlantSortOptions(this.configService);
  }

  getFilterOptions(): FilterOption[] {
    return PLANT_FILTER_OPTIONS;
  }
}
