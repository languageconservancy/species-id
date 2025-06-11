import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { SqliteService } from './services/sqlite.service';
import { MainMenuComponent } from './partials/main-menu/main-menu.component';
import { StorageReadyService } from './services/storage-ready.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet, MainMenuComponent],
})
export class AppComponent {
  constructor(
    private sqliteService: SqliteService,
    private storageReady: StorageReadyService
  ) {
    this.init();
  }

  private async init() {
    await this.storageReady.ready();
  }

  async ngOnDestroy() {
    // Close the SQLite database connection when the app component is destroyed
    // Initialization is handled in main.ts, so we just need to ensure cleanup here
    await this.sqliteService.close();
  }
}
