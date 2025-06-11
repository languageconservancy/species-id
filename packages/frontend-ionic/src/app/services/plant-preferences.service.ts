import { Injectable } from '@angular/core';
import { StorageReadyService } from './storage-ready.service';
import { Storage } from '@ionic/storage-angular';

export enum SortOption {
  AlphabeticalLocal = 'alphabetical-local',
  AlphabeticalEnglish = 'alphabetical-english',
  ByFamily = 'by-family',
  ByHeight = 'by-height',
}

@Injectable({ providedIn: 'root' })
export class PlantPreferencesService {
  private readonly SORT_KEY = 'plantSort';
  private readonly FILTERS_KEY = 'plantFilters';

  constructor(
    private storage: Storage,
    private storageReady: StorageReadyService
  ) {
    this.init();
  }

  async getSort(): Promise<SortOption> {
    await this.init();
    return (await this.storage.get(this.SORT_KEY)) ?? SortOption.AlphabeticalLocal;
  }

  private async init() {
    await this.storageReady.ready();
  }

  async setSort(option: SortOption): Promise<void> {
    await this.init();
    await this.storage.set(this.SORT_KEY, option);
  }

  async getFilters(): Promise<Record<string, any>> {
    await this.init();
    return (await this.storage.get(this.FILTERS_KEY)) ?? {};
  }

  async setFilters(filters: Record<string, any>): Promise<void> {
    await this.init();
    await this.storage.set(this.FILTERS_KEY, filters);
  }

  async clearAll(): Promise<void> {
    await this.init();
    await this.storage.remove(this.SORT_KEY);
    await this.storage.remove(this.FILTERS_KEY);
  }
}
