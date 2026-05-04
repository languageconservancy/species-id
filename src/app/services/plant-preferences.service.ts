// plant-preferences.service.ts
import { Injectable } from '@angular/core';
import { StorageReadyService } from './storage-ready.service';
import { Storage } from '@ionic/storage-angular';
import {
  BasePreferencesService,
  FilterOption,
  SortOption,
} from 'app/services/base-preferences.service';
import { getPlantSortOptions } from 'app/constants/plant-options';
import { ConfigService } from 'app/services/config.service';
import { PlantQueriesService } from 'app/services/plant-queries.service';

@Injectable({ providedIn: 'root' })
export class PlantPreferencesService extends BasePreferencesService {
  protected readonly SORT_KEY = 'plantSort';
  protected readonly SORT_DIRECTION_KEY = 'plantSortDirection';
  protected readonly FILTERS_KEY = 'plantFilters';
  private readonly allFilterOption: FilterOption = { value: 'all', label: 'All' };

  constructor(
    protected override storage: Storage,
    protected override storageReady: StorageReadyService,
    protected configService: ConfigService,
    private plantQueriesService: PlantQueriesService
  ) {
    console.log('PlantPreferencesService constructor');
    super(storage, storageReady);
  }

  getSortOptions(): SortOption[] {
    return getPlantSortOptions(this.configService);
  }

  async getFilterOptions(): Promise<FilterOption[]> {
    const categories = await this.plantQueriesService.getPlantCategories();
    const categoryOptions = categories.map((category) => ({
      value: category,
      label: category,
    }));

    return [this.allFilterOption, ...categoryOptions];
  }
}
