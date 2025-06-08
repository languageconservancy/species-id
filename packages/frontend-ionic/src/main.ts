import { bootstrapApplication } from '@angular/platform-browser';
import {
  RouteReuseStrategy,
  provideRouter,
  withPreloading,
  PreloadAllModules,
} from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { enableProdMode } from '@angular/core';
import { environment } from './environments/environment';
import { SqliteService } from 'app/services/sqlite.service';

import { routes } from 'app/app.routes';
import { AppComponent } from 'app/app.component';
import { register as registerSwiperElements } from 'swiper/element/bundle';
import { App } from '@capacitor/app';

registerSwiperElements();

if (environment.production) {
  enableProdMode();
}

const appPromise = bootstrapApplication(AppComponent, {
  providers: [
    SqliteService,
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
  ],
});

// Once app bootstraps, initialize the SQLite service
appPromise.then(async (appRef) => {
  const sqliteService = appRef.injector.get(SqliteService);
  await sqliteService.init();

  App.addListener('appStateChange', async ({ isActive }) => {
    // If the app is active, ensure the SQLite connection is established
    // This is useful for scenarios where the app might go to the background and come back
    console.log('App state changed:', isActive ? 'Active' : 'Inactive');
    if (isActive) {
      await sqliteService.ensureConnection();
    }
  });
});
