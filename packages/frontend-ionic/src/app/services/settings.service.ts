import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { StorageReadyService } from './storage-ready.service';
import { BasePreferencesService, SortOption, FilterOption } from './base-preferences.service';
import { BehaviorSubject, Observable } from 'rxjs';

export interface AppSettings {
  useEnglish: boolean;
  showScientificNames: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class SettingsService extends BasePreferencesService {
  protected readonly SORT_KEY = 'app_settings_sort';
  protected readonly FILTERS_KEY = 'app_settings_filters';
  protected readonly SORT_DIRECTION_KEY = 'app_settings_sort_direction';
  private readonly SETTINGS_KEY = 'app_settings';

  private settingsSubject = new BehaviorSubject<AppSettings>({
    useEnglish: true,
    showScientificNames: true,
  });

  constructor(
    protected override storage: Storage,
    protected override storageReady: StorageReadyService
  ) {
    super(storage, storageReady);
    this.initSettings();
  }

  private async initSettings() {
    await this.storageReady.ready();
    const settings = (await this.storage.get(this.SETTINGS_KEY)) ?? this.settingsSubject.value;
    this.settingsSubject.next(settings);
  }

  getSettings(): Observable<AppSettings> {
    return this.settingsSubject.asObservable();
  }

  async updateSettings(settings: Partial<AppSettings>): Promise<void> {
    console.log('updateSettings', settings);
    await this.storageReady.ready();
    const currentSettings = this.settingsSubject.value;
    const newSettings = { ...currentSettings, ...settings };
    await this.storage.set(this.SETTINGS_KEY, newSettings);
    this.settingsSubject.next(newSettings);
  }

  // Required abstract method implementations
  getSortOptions(): SortOption[] {
    return [];
  }

  getFilterOptions(): FilterOption[] {
    return [];
  }
}
