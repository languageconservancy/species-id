// bird-preferences.service.ts
import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { StorageReadyService } from './storage-ready.service';
import { BirdSortOption } from 'app/constants/bird-options';

@Injectable({ providedIn: 'root' })
export class BirdPreferencesService {
  private readonly SORT_KEY = 'birdSort';
  private readonly FILTERS_KEY = 'birdFilters';

  constructor(
    private storage: Storage,
    private storageReady: StorageReadyService
  ) {
    this.init();
  }

  private async init() {
    await this.storageReady.ready();
  }

  async getSort(): Promise<BirdSortOption> {
    await this.init();
    return (await this.storage.get(this.SORT_KEY)) ?? 'alphabetical-local';
  }

  async setSort(option: BirdSortOption): Promise<void> {
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
