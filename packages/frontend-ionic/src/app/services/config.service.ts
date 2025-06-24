import { Injectable } from '@angular/core';

export interface AppConfig {
  assetBaseUrl: string;
  dbName: string;
  dbVersion: number;
  dbMode: string;
  dbEncrypted: boolean;
  dbReadOnly: boolean;
  mainMenuLabel: string;
  language: string;
  [key: string]: any; // allow extensibility
}

@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  private config: AppConfig | null = null;
  private readonly configPath = 'assets/config/config.json';

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
      console.log('config', this.config);
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
}
