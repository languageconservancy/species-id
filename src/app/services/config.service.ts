import { Injectable } from '@angular/core';
import { ASSET_PATHS } from 'app/constants/app-consts';

export interface DomainLabels {
  bird?: string;
  plant?: string;
}

export interface DomainIconUrls {
  bird?: string;
  plant?: string;
}

export interface AppConfig {
  assetBaseUrl: string;
  dbName: string;
  dbVersion: number;
  dbMode: string;
  dbEncrypted: boolean;
  dbReadOnly: boolean;
  mainMenuLabel: string;
  language: string;
  /** Short description under the app title on the landing page. */
  landingSubtitle?: string;
  /** Display labels for the two domains (e.g. menu, buttons). */
  domainLabels?: DomainLabels;
  /** About page: short tagline (e.g. "A comprehensive guide to..."). */
  aboutDescription?: string;
  /** About page: longer body paragraph. */
  aboutBody?: string;
  /** Optional icon image URLs for menu/tabs (e.g. from species-data/branding/icons). */
  domainIconUrls?: DomainIconUrls;
  /** Optional short labels for tab bar (defaults to domainLabels). */
  tabLabels?: DomainLabels;
  /** Version string shown in the app (e.g. landing, about). When set, overrides package.json version. */
  appVersion?: string;
  /** Primary credit line (e.g. authoring organization). */
  creditsAuthor?: string;
  /** Funding / program acknowledgment (e.g. MILP). Shown on landing and about. */
  creditsAcknowledgment?: string;
  [key: string]: any; // allow extensibility
}

@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  private config: AppConfig | null = null;
  private readonly configPath = ASSET_PATHS.SPECIES_CONFIG;

  /**
   * Loads the config file from the assets/config/config.json file.
   * @returns {Promise<void>} - A promise that resolves when the config is loaded.
   */
  async load(): Promise<void> {
    if (this.config) {
      console.log('config already loaded', this.config);
      return; // already loaded
    }

    try {
      const res = await fetch(this.configPath);
      if (!res.ok) {
        throw new Error('Config file not found or unreadable');
      }
      this.config = await res.json();
    } catch (err) {
      throw new Error(`❌ Failed to load config.json: ${err}`);
    }
  }

  /**
   * Returns a specific config value.
   * @param key {keyof AppConfig} - The key of the config value to return.
   * @param fallback {T} - The fallback value to return if the config value is not found.
   * @returns {T} - The config value.
   */
  get<T = any>(key: keyof AppConfig, fallback?: T): T | undefined {
    if (!this.config) {
      console.warn('⚠️ Config not yet loaded. Could not get config value for key', key);
      return fallback;
    }
    return (this.config[key] as T) ?? fallback;
  }

  /**
   * Returns the entire config object.
   * @returns {AppConfig} - The config object.
   */
  getAll(): AppConfig {
    return this.config as AppConfig;
  }

  /**
   * Returns domain display labels, supporting both object shape (bird/plant) and legacy array shape.
   */
  getDomainLabels(): DomainLabels {
    const raw = this.config?.domainLabels;
    if (!raw) return { bird: 'Birds', plant: 'Plants' };
    if (Array.isArray(raw)) {
      const out: DomainLabels = {};
      for (const entry of raw as Array<{ domain?: string; label?: string }>) {
        if (entry.domain === 'birds' && entry.label) out.bird = entry.label;
        if (entry.domain === 'plants' && entry.label) out.plant = entry.label;
      }
      return { bird: out.bird ?? 'Birds', plant: out.plant ?? 'Plants' };
    }
    return {
      bird: (raw as DomainLabels).bird ?? 'Birds',
      plant: (raw as DomainLabels).plant ?? 'Plants',
    };
  }

  /** Tab bar labels (defaults to domain labels). */
  getTabLabels(): DomainLabels {
    const tabLabels = this.config?.tabLabels as DomainLabels | undefined;
    if (tabLabels?.bird || tabLabels?.plant) {
      return {
        bird: tabLabels.bird ?? this.getDomainLabels().bird ?? 'Birds',
        plant: tabLabels.plant ?? this.getDomainLabels().plant ?? 'Plants',
      };
    }
    return this.getDomainLabels();
  }

  /** Optional icon image URLs for domain menu/tab icons (from species-data/branding). */
  getDomainIconUrls(): DomainIconUrls | null {
    const urls = this.config?.domainIconUrls as DomainIconUrls | undefined;
    if (!urls?.bird && !urls?.plant) return null;
    return { bird: urls?.bird, plant: urls?.plant };
  }
}
