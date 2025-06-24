import { Injectable } from '@angular/core';
import { StorageReadyService } from './storage-ready.service';
import { Storage } from '@ionic/storage-angular';
import {
  BasePreferencesService,
  SortOption,
  FilterOption,
} from 'app/services/base-preferences.service';
import { getPlantSortOptions, PLANT_FILTER_OPTIONS } from 'app/constants/plant-options';
import { ConfigService } from 'app/services/config.service';

@Injectable({ providedIn: 'root' })
export class PlantPreferencesService extends BasePreferencesService {
  protected readonly SORT_KEY = 'plantSort';
  protected readonly FILTERS_KEY = 'plantFilters';
  protected readonly SORT_DIRECTION_KEY = 'plantSortDirection';

  constructor(
    protected override storage: Storage,
    protected override storageReady: StorageReadyService,
    protected configService: ConfigService
  ) {
    super(storage, storageReady);
  }

  getSortOptions(): SortOption[] {
    return getPlantSortOptions(this.configService);
  }

  getFilterOptions(): FilterOption[] {
    return PLANT_FILTER_OPTIONS;
  }
}
