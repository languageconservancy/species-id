import { Component, OnDestroy } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { MainMenuComponent } from './partials/main-menu/main-menu.component';
import { StorageReadyService } from './services/storage-ready.service';
import { SqljsService } from './services/sqljs.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet, MainMenuComponent],
})
export class AppComponent implements OnDestroy {
  constructor(
    private sqljsService: SqljsService,
    private storageReady: StorageReadyService
  ) {
    this.init();
  }

  private async init() {
    await this.storageReady.ready();
    // No cloud storage sync needed since we're using bundled assets
    console.log('App initialized with bundled assets');
  }

  async ngOnDestroy() {
    // Close the SQLite database connection when the app component is destroyed
    await this.sqljsService.close();
  }
}
