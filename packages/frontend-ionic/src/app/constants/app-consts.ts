// Asset paths used by multiple files
export const ASSET_PATHS = {
  // Core assets
  CORE: 'assets/core',

  // Species data assets
  SPECIES_DATA: 'assets/species-data',
  SPECIES_IMAGES: 'assets/species-data/images',
  SPECIES_AUDIOS: 'assets/species-data/audios',
  SPECIES_DATABASES: 'assets/species-data/databases',
  SPECIES_CONFIG: 'assets/species-data/config/config.json',

  // Database files
  DATABASE: (dbName: string) => `assets/species-data/databases/${dbName}.db`,

  // SQL.js WebAssembly files
  SQL_WASM: 'assets/core/sql-wasm.wasm',
  SQL_JS: 'assets/core/sql-wasm.js',
  WARNING_EMOJI: '⚠️',
  INFO_EMOJI: 'ℹ️',
  SUCCESS_EMOJI: '✅',
  ERROR_EMOJI: '❌',
  QUESTION_EMOJI: '❓',
} as const;

export const RECORDING_MAX_DURATION_MS = 5000;
