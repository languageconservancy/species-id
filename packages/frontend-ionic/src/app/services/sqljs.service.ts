import { Injectable } from '@angular/core';
import { ConfigService } from 'app/services/config.service';
import { ASSET_PATHS } from 'app/constants/app-consts';

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

  constructor(private configService: ConfigService) {
    this.dbName = this.configService.get('dbName') ?? 'production';
  }

  /**
   * Initializes the SQL.js database connection.
   * This method loads the WebAssembly module and opens the database.
   * @returns {Promise<void>} A promise that resolves when the database is initialized.
   */
  async init(): Promise<void> {
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

          // Return path to the sql-wasm.wasm file in the assets folder
          let path = '';
          path = `${ASSET_PATHS.CORE}/${file}`;

          console.log(`SQL.js: path: ${path}`);
          return path;
        },
      });

      console.log('SQL.js: WebAssembly module loaded successfully');
    } catch (error) {
      console.error(ASSET_PATHS.ERROR_EMOJI, 'SQL.js: Error loading WebAssembly module:', error);
      throw error;
    }
  }

  /**
   * Loads the database file from bundled assets.
   * <dbName> is defined in the config.json file.
   */
  private async loadDatabase(): Promise<void> {
    try {
      console.log(`SQL.js: Loading database file from bundled assets: databases/${this.dbName}.db`);

      // Fetch the database file from bundled assets
      const response = await fetch(ASSET_PATHS.DATABASE(this.dbName));
      if (!response.ok) {
        throw new Error(`Failed to fetch database: ${response.status} ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const binaryData = new Uint8Array(arrayBuffer);

      // Create SQLite database from binary data
      this.database = new this.sqliteModule!.Database(binaryData) as SQLiteDatabase;

      console.log('SQL.js: Database loaded successfully');

      // Debug: Check what tables exist
      await this.debugTables();
    } catch (error) {
      console.error(ASSET_PATHS.ERROR_EMOJI, 'SQL.js: Error loading database:', error);
      throw error;
    }
  }

  /**
   * Debug method to check available tables.
   */
  private async debugTables(): Promise<void> {
    try {
      const result = await this.executeQuery('SELECT name FROM sqlite_master WHERE type="table"');
      console.log('SQL.js: Available tables:', result);
    } catch (error) {
      console.warn(ASSET_PATHS.WARNING_EMOJI, 'SQL.js: Could not query tables:', error);
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
      // console.log('SQL.js: Executing query:', query);

      // Execute the query - SQL.js exec() returns an array of result objects
      const results = this.database.exec(query, params);

      // console.log('SQL.js: Query results:', results);

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
      console.error(ASSET_PATHS.ERROR_EMOJI, 'SQL.js: Error executing query:', error);
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
      console.warn(ASSET_PATHS.WARNING_EMOJI, 'SQL.js: Database not initialized, reinitializing');
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
