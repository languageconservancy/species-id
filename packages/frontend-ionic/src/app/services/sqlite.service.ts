import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { defineCustomElements as jeepSqlite } from 'jeep-sqlite/loader';
import { environment } from 'environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SqliteService {
  private _sqliteConnection!: SQLiteConnection;
  private _db: SQLiteDBConnection | undefined;

  constructor() {
    this._sqliteConnection = new SQLiteConnection(CapacitorSQLite);
  }

  /**
   * Initializes the SQLite database connection.
   * This method sets up the database connection and opens it.
   * @returns {Promise<void>} A promise that resolves when the database is initialized.
   */
  async init(): Promise<void> {
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

    await this._sqliteConnection.copyFromAssets();

    console.debug(
      'SQLiteService: init - Initializing SQLite connection with environment:',
      environment
    );
    this._db = await this._sqliteConnection.createConnection(
      environment.dbName,
      environment.dbEncrypted,
      environment.dbMode,
      environment.dbVersion,
      environment.dbReadonly
    );

    await this._db.open();

    const result = await this._db.query('SELECT * FROM birds;');
    console.debug('SQLiteService: init - Query result:', result);
  }

  /**
   * Loads the database JSON file.
   * This method fetches the JSON file containing the database schema and data.
   * @returns {Promise<string>} A promise that resolves with the JSON string of the database.
   */
  private async _loadDbJson(): Promise<string> {
    try {
      const response = await fetch(`assets/databases/db-config.json`);
      if (!response.ok) {
        throw new Error(`Failed to load database JSON: ${response.statusText}`);
      }
      const json = await response.text();
      console.debug('SQLiteService: _loadDbJson - Loaded JSON:', json);
      return json;
    } catch (error) {
      console.error('SQLiteService: _loadDbJson - Error loading JSON:', error);
      throw error;
    }
  }

  /**
   * Closes the SQLite database connection.
   * This method closes the database connection if it is open.
   * @returns {Promise<void>} A promise that resolves when the database is closed.
   */
  async close(): Promise<void> {
    if (this._db) {
      await this._sqliteConnection.closeConnection(environment.dbName, false);
      this._db = undefined;
    }
  }
}
