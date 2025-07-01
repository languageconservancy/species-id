import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { ConfigService } from 'app/services/config.service';
import { defineCustomElements as jeepSqlite } from 'jeep-sqlite/loader';
import { ASSET_PATHS } from 'app/constants/app-consts';

@Injectable({
  providedIn: 'root',
})
export class SqliteService {
  private _sqliteConnection!: SQLiteConnection;
  private _db: SQLiteDBConnection | undefined;
  private readonly dbName: string = '';
  private readonly dbVersion: number = 0;
  private readonly dbMode: string = '';
  private readonly dbEncrypted: boolean = false;
  private readonly dbReadOnly: boolean = false;

  constructor(private configService: ConfigService) {
    this.dbName = this.configService.get('dbName') ?? 'db-prod';
    this.dbVersion = this.configService.get('dbVersion') ?? 1;
    this.dbMode = this.configService.get('dbMode') ?? 'no-encryption';
    this.dbEncrypted = this.configService.get('dbEncrypted') ?? false;
    this.dbReadOnly = this.configService.get('dbReadOnly') ?? false;
    this._sqliteConnection = new SQLiteConnection(CapacitorSQLite);
  }

  /**
   * Initializes the SQLite database connection.
   * This method sets up the database connection and opens it.
   * @returns {Promise<void>} A promise that resolves when the database is initialized.
   */
  async init(): Promise<void> {
    console.log('db is ready');

    if (Capacitor.getPlatform() === 'web') {
      // Define custom elements for Jeep SQLite
      jeepSqlite(window);

      if (!document.querySelector('jeep-sqlite')) {
        // Dynamically create the jeep-sqlite element if it doesn't exist
        // This is necessary for the Jeep SQLite component to work properly in web environments
        const jeepEl = document.createElement('jeep-sqlite');
        document.body.appendChild(jeepEl);
        await customElements.whenDefined('jeep-sqlite');
        // Ensure component persists its internal data (IndexedDB) across page reloads
        // This is useful for offline scenarios
        jeepEl.autoSave = true;
      }

      // Initialize the SQLite connection for web
      await this._sqliteConnection.initWebStore();

      const json = await this._loadDbJson();
      if (!json) {
        throw new Error('SQLiteService: init - Database JSON is empty or not found.');
      }
      const res = await this._sqliteConnection.importFromJson(JSON.stringify(json));
      console.log('SQLiteService: init - DB imported:', res);
    }

    // Database files are now in bundled assets, no need to copy
    console.log('SQLiteService: init - Database files are in bundled assets, ready for use');

    await this._createConnectionAndOpenDb();
  }

  private async _createConnectionAndOpenDb() {
    if (this._db) {
      console.warn('SQLiteService: createConnectionAndOpenDb - Database is already initialized.');
      return;
    }

    console.log('SQLiteService: Creating connection for database:', this.dbName);
    console.log(
      'SQLiteService: Database config:',
      JSON.stringify({
        name: this.dbName,
        version: this.dbVersion,
        mode: this.dbMode,
        encrypted: this.dbEncrypted,
        readOnly: this.dbReadOnly,
      })
    );

    try {
      this._db = await this._sqliteConnection.createConnection(
        this.dbName,
        this.dbEncrypted,
        this.dbMode,
        this.dbVersion,
        this.dbReadOnly
      );
      console.log('SQLiteService: Database connection created successfully');
    } catch (error) {
      console.error(
        ASSET_PATHS.ERROR_EMOJI,
        'SQLiteService: createConnectionAndOpenDb - Error creating connection:',
        error
      );
      throw error;
    }

    try {
      await this._db.open();
      console.log('SQLiteService: Database opened successfully');

      // Debug: Check what tables exist
      try {
        const tablesResult = await this._db.query(
          'SELECT name FROM sqlite_master WHERE type="table"'
        );
        console.log('SQLiteService: Available tables:', tablesResult.values);
      } catch (tableError) {
        console.warn('SQLiteService: Could not query tables:', tableError);
      }
    } catch (error) {
      console.error(
        ASSET_PATHS.ERROR_EMOJI,
        'SQLiteService: createConnectionAndOpenDb - Error opening database:',
        error
      );
      throw error;
    }
  }

  /**
   * Executes a SQL query on the SQLite database.
   * This method allows executing any SQL query and returns the result.
   * @param {string} query - The SQL query to execute.
   * @returns {Promise<any>} A promise that resolves with the query result.
   */
  async executeQuery(query: string, params?: any[]): Promise<any> {
    const db = await this.getDb();

    if (!db) {
      throw new Error('SQLiteService: executeQuery - Database connection is not established.');
    }

    try {
      const result = await db.query(query, params ?? []);
      return result;
    } catch (error) {
      console.error(
        ASSET_PATHS.ERROR_EMOJI,
        'SQLiteService: executeQuery - Error executing query:',
        error
      );
      throw error;
    }
  }

  async getDb(): Promise<SQLiteDBConnection> {
    await this.ensureConnection();
    if (!this._db) {
      throw new Error('SQLiteService: getDb - Database connection is not established.');
    }
    return this._db;
  }

  /**
   * Loads the database JSON file from bundled assets.
   * This method reads the JSON file containing the database schema and data.
   * @returns {Promise<string>} A promise that resolves with the JSON string of the database.
   */
  private async _loadDbJson(): Promise<string> {
    try {
      console.log('SQLiteService: _loadDbJson - Loading database config from bundled assets');
      const response = await fetch(`${ASSET_PATHS.SPECIES_DATABASES}/db-config.json`);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch database config: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.text();
      console.log('SQLiteService: _loadDbJson - Successfully loaded database config');
      return data;
    } catch (error) {
      console.error(
        ASSET_PATHS.ERROR_EMOJI,
        'SQLiteService: _loadDbJson - Error loading JSON:',
        error
      );
      throw new Error(`Failed to load database config from bundled assets: ${error}`);
    }
  }

  /**
   * Ensures the SQLite database connection is established.
   * This method checks if the database is open and reopens it if necessary.
   * @returns {Promise<void>} A promise that resolves when the connection is ensured.
   */
  async ensureConnection(): Promise<void> {
    const connectionExists = await this._sqliteConnection.isConnection(
      this.dbName,
      this.dbReadOnly
    );

    if (!connectionExists) {
      console.warn(
        ASSET_PATHS.WARNING_EMOJI,
        'SQLiteService: ensureConnection - Connection does not exist, creating a new one.'
      );
      await this._createConnectionAndOpenDb();
    }
  }

  /**
   * Closes the SQLite database connection.
   * This method closes the database connection if it is open.
   * @returns {Promise<void>} A promise that resolves when the database is closed.
   */
  async close(): Promise<void> {
    if (this._db) {
      await this._sqliteConnection.closeConnection(this.dbName, false);
      this._db = undefined;
    }
  }
}
