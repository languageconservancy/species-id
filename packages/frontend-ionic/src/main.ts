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
import { Storage } from '@ionic/storage-angular';
import { routes } from 'app/app.routes';
import { AppComponent } from 'app/app.component';
import { register as registerSwiperElements } from 'swiper/element/bundle';
import { App } from '@capacitor/app';
import { createAnimation } from '@ionic/angular';
import { StatusBar } from '@capacitor/status-bar';

StatusBar.hide();

registerSwiperElements();

if (environment.production) {
  enableProdMode();
}

const appPromise = bootstrapApplication(AppComponent, {
  providers: [
    SqliteService,
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular({
      mode: 'ios',
      animated: true,
      navAnimation: (baseEl: any, opts?: any) => {
        const enteringEl = opts.enteringEl;
        const leavingEl = opts.leavingEl;
        const direction = opts.direction;

        const enteringAnimation = createAnimation()
          .addElement(enteringEl)
          .duration(300)
          .easing('ease-in-out')
          .fromTo(
            'transform',
            direction === 'forward' ? 'translateX(100%)' : 'translateX(-100%)',
            'translateX(0)'
          )
          .fromTo('opacity', 0, 1);

        const leavingAnimation = createAnimation()
          .addElement(leavingEl)
          .duration(300)
          .easing('ease-in-out')
          .fromTo(
            'transform',
            'translateX(0)',
            direction === 'forward' ? 'translateX(-100%)' : 'translateX(100%)'
          )
          .fromTo('opacity', 1, 0);

        return createAnimation().addAnimation([enteringAnimation, leavingAnimation]);
      },
    }),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    { provide: Storage, useClass: Storage },
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
