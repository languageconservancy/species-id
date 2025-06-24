import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { defineCustomElements as jeepSqlite } from 'jeep-sqlite/loader';
import { ConfigService } from 'app/services/config.service';
import { CloudStorageSyncService } from 'app/services/cloud-storage-sync.service';
import { Filesystem, Directory } from '@capacitor/filesystem';

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

  constructor(
    private configService: ConfigService,
    private cloudStorageSyncService: CloudStorageSyncService
  ) {
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
    await this.cloudStorageSyncService.waitUntilDbIsReady();
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

    // Database files are now in Library/NoCloud, no need to copy from assets
    console.log(
      'SQLiteService: init - Database files are in Library/NoCloud, skipping copyFromAssets'
    );

    await this._createConnectionAndOpenDb();
  }

  private async _createConnectionAndOpenDb() {
    if (this._db) {
      console.warn('SQLiteService: createConnectionAndOpenDb - Database is already initialized.');
      return;
    }

    try {
      this._db = await this._sqliteConnection.createConnection(
        this.dbName,
        this.dbEncrypted,
        this.dbMode,
        this.dbVersion,
        this.dbReadOnly
      );
    } catch (error) {
      console.error('SQLiteService: createConnectionAndOpenDb - Error creating connection:', error);
      throw error;
    }

    try {
      await this._db.open();
      console.debug('SQLiteService: createConnectionAndOpenDb - Database connection opened.');
    } catch (error) {
      console.error('SQLiteService: createConnectionAndOpenDb - Error opening database:', error);
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
      console.error('SQLiteService: executeQuery - Error executing query:', error);
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
   * Loads the database JSON file from Library/NoCloud.
   * This method reads the JSON file containing the database schema and data.
   * @returns {Promise<string>} A promise that resolves with the JSON string of the database.
   */
  private async _loadDbJson(): Promise<string> {
    try {
      console.log('SQLiteService: _loadDbJson - Loading database config from Library/NoCloud');
      const { data } = await Filesystem.readFile({
        path: 'databases/db-config.json',
        directory: Directory.LibraryNoCloud,
      });

      if (typeof data !== 'string') {
        throw new Error('Database config data is not a string');
      }

      console.log('SQLiteService: _loadDbJson - Successfully loaded database config');
      return data;
    } catch (error) {
      console.error('SQLiteService: _loadDbJson - Error loading JSON:', error);
      throw new Error(`Failed to load database config from Library/NoCloud: ${error}`);
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
