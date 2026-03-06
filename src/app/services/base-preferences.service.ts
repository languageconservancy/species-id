import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { StorageReadyService } from './storage-ready.service';
import { BehaviorSubject, Observable } from 'rxjs';

export interface SortOption {
  value: string;
  label: string;
}

export interface FilterOption {
  value: string;
  label: string;
}

export interface Preferences {
  sort: string;
  filters: Record<string, any>;
  sortDirection: string;
}

@Injectable()
export abstract class BasePreferencesService {
  protected abstract readonly SORT_KEY: string;
  protected abstract readonly FILTERS_KEY: string;
  protected abstract readonly SORT_DIRECTION_KEY: string;
  private preferencesSubject = new BehaviorSubject<Preferences>({
    sort: '',
    filters: {},
    sortDirection: 'ascending',
  });

  constructor(
    protected storage: Storage,
    protected storageReady: StorageReadyService
  ) {
    this.init();
  }

  protected async init() {
    await this.storageReady.ready();
    // Load initial preferences
    const sortOptions = this.getSortOptions();

    // Safely get default sort value with fallback
    const defaultSortValue = sortOptions && sortOptions.length > 0 ? sortOptions[0].value : '';
    const sort = (await this.storage.get(this.SORT_KEY)) ?? defaultSortValue;
    const filters = (await this.storage.get(this.FILTERS_KEY)) ?? {};
    const sortDirection = (await this.storage.get(this.SORT_DIRECTION_KEY)) ?? 'ascending';
    this.preferencesSubject.next({ sort, filters, sortDirection });
  }

  abstract getSortOptions(): SortOption[];
  abstract getFilterOptions(): FilterOption[];

  getPreferences(): Observable<Preferences> {
    return this.preferencesSubject.asObservable();
  }

  async getSort(): Promise<string> {
    await this.storageReady.ready();
    const sortOptions = this.getSortOptions();
    const defaultSortValue = sortOptions && sortOptions.length > 0 ? sortOptions[0].value : '';
    return (await this.storage.get(this.SORT_KEY)) ?? defaultSortValue;
  }

  async setSort(option: string): Promise<void> {
    await this.storageReady.ready();
    await this.storage.set(this.SORT_KEY, option);
    const current = this.preferencesSubject.value;
    this.preferencesSubject.next({ ...current, sort: option });
  }

  async getFilters(): Promise<Record<string, any>> {
    await this.storageReady.ready();
    return (await this.storage.get(this.FILTERS_KEY)) ?? {};
  }

  async setFilters(filters: Record<string, any>): Promise<void> {
    await this.storageReady.ready();
    await this.storage.set(this.FILTERS_KEY, filters);
    const current = this.preferencesSubject.value;
    this.preferencesSubject.next({ ...current, filters });
  }

  async setSortDirection(direction: string): Promise<void> {
    await this.storageReady.ready();
    await this.storage.set(this.SORT_DIRECTION_KEY, direction);
    const current = this.preferencesSubject.value;
    this.preferencesSubject.next({ ...current, sortDirection: direction });
  }

  async getSortDirection(): Promise<string> {
    await this.storageReady.ready();
    return (await this.storage.get(this.SORT_DIRECTION_KEY)) ?? 'ascending';
  }

  async clearAll(): Promise<void> {
    await this.storageReady.ready();
    await this.storage.remove(this.SORT_KEY);
    await this.storage.remove(this.FILTERS_KEY);
    const sortOptions = this.getSortOptions();
    const defaultSortValue = sortOptions && sortOptions.length > 0 ? sortOptions[0].value : '';
    this.preferencesSubject.next({
      sort: defaultSortValue,
      filters: {},
      sortDirection: 'ascending',
    });
  }
}
