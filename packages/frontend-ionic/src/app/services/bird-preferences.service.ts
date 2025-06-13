// bird-preferences.service.ts
import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { StorageReadyService } from './storage-ready.service';
import {
  BasePreferencesService,
  SortOption,
  FilterOption,
} from 'app/services/base-preferences.service';
import { BIRD_SORT_OPTIONS, BIRD_FILTER_OPTIONS } from 'app/constants/bird-options';

@Injectable({ providedIn: 'root' })
export class BirdPreferencesService extends BasePreferencesService {
  protected readonly SORT_KEY = 'birdSort';
  protected readonly FILTERS_KEY = 'birdFilters';
  protected readonly SORT_DIRECTION_KEY = 'birdSortDirection';

  constructor(
    protected override storage: Storage,
    protected override storageReady: StorageReadyService
  ) {
    super(storage, storageReady);
  }

  getSortOptions(): SortOption[] {
    return BIRD_SORT_OPTIONS;
  }

  getFilterOptions(): FilterOption[] {
    return BIRD_FILTER_OPTIONS;
  }
}
