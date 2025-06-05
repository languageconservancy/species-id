import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { SqliteService } from './services/sqlite.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  constructor(private sqliteService: SqliteService) {}

  async ngOnDestroy() {
    // Close the SQLite database connection when the app component is destroyed
    // Initialization is handled in main.ts, so we just need to ensure cleanup here
    await this.sqliteService.close();
  }
}
