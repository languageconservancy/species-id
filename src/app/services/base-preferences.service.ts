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

export interface SearchFields {
  english: boolean;
  scientific: boolean;
  meaning: boolean;
}

export const DEFAULT_SEARCH_FIELDS: SearchFields = {
  english: true,
  scientific: true,
  meaning: true,
};

export interface Preferences {
  sort: string;
  filters: Record<string, any>;
  sortDirection: string;
  searchFields: SearchFields;
}

@Injectable()
export abstract class BasePreferencesService {
  protected abstract readonly SORT_KEY: string;
  protected abstract readonly FILTERS_KEY: string;
  protected abstract readonly SORT_DIRECTION_KEY: string;
  protected abstract readonly SEARCH_FIELDS_KEY: string;
  private preferencesSubject = new BehaviorSubject<Preferences>({
    sort: '',
    filters: {},
    sortDirection: 'ascending',
    searchFields: { ...DEFAULT_SEARCH_FIELDS },
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
    const searchFields = this._normalizeSearchFields(
      await this.storage.get(this.SEARCH_FIELDS_KEY)
    );
    this.preferencesSubject.next({ sort, filters, sortDirection, searchFields });
  }

  private _normalizeSearchFields(stored: any): SearchFields {
    if (!stored || typeof stored !== 'object') {
      return { ...DEFAULT_SEARCH_FIELDS };
    }
    return {
      english: typeof stored.english === 'boolean' ? stored.english : DEFAULT_SEARCH_FIELDS.english,
      scientific:
        typeof stored.scientific === 'boolean'
          ? stored.scientific
          : DEFAULT_SEARCH_FIELDS.scientific,
      meaning: typeof stored.meaning === 'boolean' ? stored.meaning : DEFAULT_SEARCH_FIELDS.meaning,
    };
  }

  abstract getSortOptions(): SortOption[];
  abstract getFilterOptions(): Promise<FilterOption[]>;

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

  async getSearchFields(): Promise<SearchFields> {
    await this.storageReady.ready();
    return this._normalizeSearchFields(await this.storage.get(this.SEARCH_FIELDS_KEY));
  }

  async setSearchFields(searchFields: SearchFields): Promise<void> {
    await this.storageReady.ready();
    const normalized = this._normalizeSearchFields(searchFields);
    await this.storage.set(this.SEARCH_FIELDS_KEY, normalized);
    const current = this.preferencesSubject.value;
    this.preferencesSubject.next({ ...current, searchFields: normalized });
  }

  async clearAll(): Promise<void> {
    await this.storageReady.ready();
    await this.storage.remove(this.SORT_KEY);
    await this.storage.remove(this.FILTERS_KEY);
    await this.storage.remove(this.SEARCH_FIELDS_KEY);
    const sortOptions = this.getSortOptions();
    const defaultSortValue = sortOptions && sortOptions.length > 0 ? sortOptions[0].value : '';
    this.preferencesSubject.next({
      sort: defaultSortValue,
      filters: {},
      sortDirection: 'ascending',
      searchFields: { ...DEFAULT_SEARCH_FIELDS },
    });
  }
}
