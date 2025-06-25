import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { SqliteService } from './services/sqlite.service';
import { MainMenuComponent } from './partials/main-menu/main-menu.component';
import { StorageReadyService } from './services/storage-ready.service';
import { CloudStorageSyncService } from './services/cloud-storage-sync.service';
import { SqljsService } from './services/sqljs.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet, MainMenuComponent],
})
export class AppComponent {
  constructor(
    private sqljsService: SqljsService,
    private storageReady: StorageReadyService,
    private cloudStorageSyncService: CloudStorageSyncService
  ) {
    this.init();
  }

  private async init() {
    await this.storageReady.ready();
    await this.syncCloudStorage();
  }

  private async syncCloudStorage() {
    const initialSyncComplete = await this.cloudStorageSyncService.isInitialSyncComplete();
    if (!initialSyncComplete) {
      console.log('Initial sync not complete, running initial sync');
      // Need to get database and assets from the cloud storage.
      await this.cloudStorageSyncService.runInitialSync();
    } else {
      console.log('Initial sync is complete, checking for updates');
      // Initial sync is complete, but we need to check if the database and assets are up to date.
      await this.cloudStorageSyncService.checkForUpdates();
    }
  }

  async ngOnDestroy() {
    // Close the SQLite database connection when the app component is destroyed
    // Initialization is handled in main.ts, so we just need to ensure cleanup here
    await this.sqljsService.close();
  }
}
