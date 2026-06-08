import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { StorageReadyService } from './storage-ready.service';
import { BasePreferencesService, SortOption, FilterOption } from './base-preferences.service';
import { BehaviorSubject, Observable } from 'rxjs';

export const TEXT_SCALE_VALUES = {
  1: 1.0,
  2: 1.15,
  3: 1.35,
  4: 1.55,
  5: 1.75,
} as const;
export const MAX_TEXT_SCALE = 5;

export type TextScaleStep = keyof typeof TEXT_SCALE_VALUES;

const TEXT_SCALE_STEPS: TextScaleStep[] = [1, 2, 3, 4, 5];

export const TEXT_SCALE_TICK_LABELS = TEXT_SCALE_STEPS.map((step) => ({
  value: step,
  label: `${TEXT_SCALE_VALUES[step]}×`,
}));

export interface AppSettings {
  useEnglish: boolean;
  showScientificNames: boolean;
  textScale: keyof typeof TEXT_SCALE_VALUES;
}

@Injectable({
  providedIn: 'root',
})
export class SettingsService extends BasePreferencesService {
  protected readonly SORT_KEY = 'app_settings_sort';
  protected readonly FILTERS_KEY = 'app_settings_filters';
  protected readonly SORT_DIRECTION_KEY = 'app_settings_sort_direction';
  protected readonly SEARCH_FIELDS_KEY = 'app_settings_search_fields';
  private readonly SETTINGS_KEY = 'app_settings';

  private settingsSubject = new BehaviorSubject<AppSettings>({
    useEnglish: true,
    showScientificNames: true,
    textScale: 2,
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
    settings.textScale = settings.textScale ?? 2;
    if (settings.textScale < 1 || settings.textScale > MAX_TEXT_SCALE) {
      settings.textScale = 1;
    }
    this.applyTextScale(settings.textScale);
    this.settingsSubject.next(settings);
  }

  getSettings(): Observable<AppSettings> {
    return this.settingsSubject.asObservable();
  }

  async updateSettings(settings: Partial<AppSettings>): Promise<void> {
    await this.storageReady.ready();
    const currentSettings = this.settingsSubject.value;
    const newSettings = { ...currentSettings, ...settings };
    await this.storage.set(this.SETTINGS_KEY, newSettings);
    this.applyTextScale(newSettings.textScale);
    this.settingsSubject.next(newSettings);
  }

  applyTextScale(textScale: keyof typeof TEXT_SCALE_VALUES) {
    const scale = TEXT_SCALE_VALUES[textScale];
    document.documentElement.style.setProperty('--app-text-scale', `${scale}`);
  }

  // Required abstract method implementations
  getSortOptions(): SortOption[] {
    return [];
  }

  async getFilterOptions(): Promise<FilterOption[]> {
    return [];
  }
}
