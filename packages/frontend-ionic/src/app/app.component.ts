import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet, ModalController } from '@ionic/angular/standalone';
import { SqliteService } from './services/sqlite.service';
import { MainMenuComponent } from './partials/main-menu/main-menu.component';
import { StorageReadyService } from './services/storage-ready.service';
import { CloudStorageSyncService } from './services/cloud-storage-sync.service';
import { SqljsService } from './services/sqljs.service';
import { UpdateComponent } from './modals/update/update.component';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet, MainMenuComponent],
})
export class AppComponent {
  constructor(
    private sqljsService: SqljsService,
    private storageReady: StorageReadyService,
    private cloudStorageSyncService: CloudStorageSyncService,
    private modalController: ModalController
  ) {
    this.init();

    // Expose debug methods to window for console testing
    (window as any).debugHash = this.debugHash.bind(this);
    (window as any).debugFileComparison = this.debugFileComparison.bind(this);
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
      const updatesAvailable = await this.cloudStorageSyncService.checkForUpdates();

      if (updatesAvailable) {
        // Check if user has seen the update prompt recently
        const hasSeenPrompt = await this.cloudStorageSyncService.hasSeenUpdatePrompt();

        if (!hasSeenPrompt) {
          // Show update popup
          await this.showUpdatePopup();
        }
      }
    }
  }

  private async showUpdatePopup() {
    try {
      const modal = await this.modalController.create({
        component: UpdateComponent,
        componentProps: {},
        presentingElement: await this.modalController.getTop(),
        breakpoints: [0, 1],
        initialBreakpoint: 1,
        backdropDismiss: false, // Prevent dismissing by tapping outside
      });

      await modal.present();

      const { data } = await modal.onWillDismiss();
      console.log('Update modal dismissed with action:', data?.action);
    } catch (error) {
      console.error('Error showing update popup:', error);
    }
  }

  // Debug methods exposed to window
  async debugHash(filePath: string) {
    await this.cloudStorageSyncService.testHashGeneration(filePath);
  }

  async debugFileComparison(remotePath: string) {
    await this.cloudStorageSyncService.debugFileComparison(remotePath);
  }

  async ngOnDestroy() {
    // Close the SQLite database connection when the app component is destroyed
    // Initialization is handled in main.ts, so we just need to ensure cleanup here
    await this.sqljsService.close();
  }
}
