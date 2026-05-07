// bird-preferences.service.ts
import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { StorageReadyService } from './storage-ready.service';
import {
  BasePreferencesService,
  FilterOption,
  SortOption,
} from 'app/services/base-preferences.service';
import { getBirdSortOptions } from 'app/constants/bird-options';
import { ConfigService } from 'app/services/config.service';
import { BirdQueriesService } from 'app/services/bird-queries.service';

@Injectable({ providedIn: 'root' })
export class BirdPreferencesService extends BasePreferencesService {
  protected readonly SORT_KEY = 'birdSort';
  protected readonly SORT_DIRECTION_KEY = 'birdSortDirection';
  protected readonly FILTERS_KEY = 'birdFilters';
  protected readonly SEARCH_FIELDS_KEY = 'birdSearchFields';
  private readonly allFilterOption: FilterOption = { value: 'all', label: 'All' };

  constructor(
    protected override storage: Storage,
    protected override storageReady: StorageReadyService,
    protected configService: ConfigService,
    private birdQueriesService: BirdQueriesService
  ) {
    console.log('BirdPreferencesService constructor');
    super(storage, storageReady);
  }

  getSortOptions(): SortOption[] {
    return getBirdSortOptions(this.configService);
  }

  async getFilterOptions(): Promise<FilterOption[]> {
    const categories = await this.birdQueriesService.getBirdCategories();
    const categoryOptions = categories.map((category) => ({
      value: category,
      label: category,
    }));

    return [this.allFilterOption, ...categoryOptions];
  }
}
