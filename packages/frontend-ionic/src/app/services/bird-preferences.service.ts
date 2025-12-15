// bird-preferences.service.ts
import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { StorageReadyService } from './storage-ready.service';
import {
  BasePreferencesService,
  FilterOption,
  SortOption,
} from 'app/services/base-preferences.service';
import { getBirdSortOptions, BIRD_FILTER_OPTIONS } from 'app/constants/bird-options';
import { ConfigService } from 'app/services/config.service';

@Injectable({ providedIn: 'root' })
export class BirdPreferencesService extends BasePreferencesService {
  protected readonly SORT_KEY = 'birdSort';
  protected readonly SORT_DIRECTION_KEY = 'birdSortDirection';
  protected readonly FILTERS_KEY = 'birdFilters';

  constructor(
    protected override storage: Storage,
    protected override storageReady: StorageReadyService,
    protected configService: ConfigService
  ) {
    console.log('BirdPreferencesService constructor');
    super(storage, storageReady);
  }

  getSortOptions(): SortOption[] {
    return getBirdSortOptions(this.configService);
  }

  getFilterOptions(): FilterOption[] {
    return BIRD_FILTER_OPTIONS;
  }
}
