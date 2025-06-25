import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { ConfigService } from 'app/services/config.service';
import { CloudStorageSyncService } from 'app/services/cloud-storage-sync.service';

// SQL.js types
interface SQLiteDatabase {
  exec(sql: string, params?: any[]): any[];
  close(): void;
  export(): Uint8Array;
}

interface SqlJsStatic {
  Database: new (data?: Uint8Array) => SQLiteDatabase;
}

declare global {
  interface Window {
    initSqlJs: (config?: any) => Promise<SqlJsStatic>;
  }
}

@Injectable({
  providedIn: 'root',
})
export class SqljsService {
  private sqliteModule: SqlJsStatic | null = null;
  private database: SQLiteDatabase | null = null;
  private readonly dbName: string = '';

  constructor(
    private configService: ConfigService,
    private cloudStorageSyncService: CloudStorageSyncService
  ) {
    this.dbName = this.configService.get('dbName') ?? 'production';
  }

  /**
   * Initializes the SQL.js database connection.
   * This method loads the WebAssembly module and opens the database.
   * @returns {Promise<void>} A promise that resolves when the database is initialized.
   */
  async init(): Promise<void> {
    await this.cloudStorageSyncService.waitUntilDbIsReady();
    console.log('SQL.js: database file is ready to be loaded');

    // Load SQL.js WebAssembly module
    await this.loadSqlJsModule();

    // Load the database file
    await this.loadDatabase();

    console.log('SQL.js: Database initialized successfully');
  }

  /**
   * Loads the SQL.js WebAssembly module.
   */
  private async loadSqlJsModule(): Promise<void> {
    try {
      console.log('SQL.js: Loading WebAssembly module');

      // Initialize SQL.js with WebAssembly
      this.sqliteModule = await window.initSqlJs({
        locateFile: (file: string) => {
          console.log(`SQL.js: Requesting file: ${file}`);

          // Handle both web and mobile paths
          let path = '';
          if (Capacitor.getPlatform() === 'web') {
            path = `/assets/${file}`;
          } else {
            path = `assets/${file}`;
          }

          console.log(`SQL.js: path: ${path}`);
          return path;
        },
      });

      console.log('SQL.js: WebAssembly module loaded successfully');
    } catch (error) {
      console.error('SQL.js: Error loading WebAssembly module:', error);
      throw error;
    }
  }

  /**
   * Loads the database file from LibraryNoCloud/databases/<dbName>.db.
   * <dbName> is defined in the config.json file.
   */
  private async loadDatabase(): Promise<void> {
    try {
      console.log(`SQL.js: Loading database file from LibraryNoCloud/databases/${this.dbName}.db`);

      // Read the database file
      const { data } = await Filesystem.readFile({
        path: `databases/${this.dbName}.db`,
        directory: Directory.LibraryNoCloud,
      });

      if (typeof data !== 'string') {
        throw new Error('Database data is not a string. The file cannot be loaded.');
      }

      // Convert base64 to Uint8Array
      const binaryData = this.base64ToUint8Array(data);

      // Create SQLite database from binary data
      this.database = new this.sqliteModule!.Database(binaryData) as SQLiteDatabase;

      console.log('SQL.js: Database loaded successfully');

      // Debug: Check what tables exist
      await this.debugTables();
    } catch (error) {
      console.error('SQL.js: Error loading database:', error);
      throw error;
    }
  }

  /**
   * Converts base64 string to Uint8Array.
   */
  private base64ToUint8Array(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  /**
   * Debug method to check available tables.
   */
  private async debugTables(): Promise<void> {
    try {
      const result = await this.executeQuery('SELECT name FROM sqlite_master WHERE type="table"');
      console.log('SQL.js: Available tables:', result);
    } catch (error) {
      console.warn('SQL.js: Could not query tables:', error);
    }
  }

  /**
   * Executes a SQL query on the SQLite database.
   * @param {string} query - The SQL query to execute.
   * @param {any[]} params - Optional parameters for the query.
   * @returns {Promise<any>} A promise that resolves with the query result.
   */
  async executeQuery(query: string, params?: any[]): Promise<any> {
    if (!this.database) {
      throw new Error('SQL.js: Database is not initialized');
    }

    try {
      console.log('SQL.js: Executing query:', query);

      // Execute the query - SQL.js exec() returns an array of result objects
      const results = this.database.exec(query, params);

      console.log('SQL.js: Query results:', results);

      // SQL.js exec() returns an array where each element represents a result set
      // Each result set has columns and values properties
      if (results.length > 0) {
        const firstResult = results[0];
        return {
          values: firstResult.values || [],
          columns: firstResult.columns || [],
        };
      } else {
        // No results returned (e.g., INSERT, UPDATE, DELETE statements)
        return {
          values: [],
          columns: [],
        };
      }
    } catch (error) {
      console.error('SQL.js: Error executing query:', error);
      throw error;
    }
  }

  /**
   * Gets the database instance.
   * @returns {Promise<SQLiteDatabase>} A promise that resolves with the database instance.
   */
  async getDb(): Promise<SQLiteDatabase> {
    if (!this.database) {
      throw new Error('SQL.js: Database is not initialized');
    }
    return this.database;
  }

  /**
   * Ensures the database connection is established.
   * @returns {Promise<void>} A promise that resolves when the connection is ensured.
   */
  async ensureConnection(): Promise<void> {
    if (!this.database) {
      console.warn('SQL.js: Database not initialized, reinitializing');
      await this.init();
    }
  }

  /**
   * Closes the database connection.
   * @returns {Promise<void>} A promise that resolves when the database is closed.
   */
  async close(): Promise<void> {
    if (this.database) {
      this.database.close();
      this.database = null;
    }
  }
}
