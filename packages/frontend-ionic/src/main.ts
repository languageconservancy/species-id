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
import { SqljsService } from 'app/services/sqljs.service';
import { Storage } from '@ionic/storage-angular';
import { routes } from 'app/app.routes';
import { AppComponent } from 'app/app.component';
import { register as registerSwiperElements } from 'swiper/element/bundle';
import { App } from '@capacitor/app';
import { createAnimation } from '@ionic/angular';
import { StatusBar } from '@capacitor/status-bar';
import { ConfigService } from 'app/services/config.service';

StatusBar.hide();

registerSwiperElements();

if (environment.production) {
  enableProdMode();
}

const configService = new ConfigService();

// Load the config service before bootstrapping the app, so all the components can use it.
configService
  .load()
  .then(() => {
    return bootstrapApplication(AppComponent, {
      providers: [
        SqljsService,
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
        // We need to provide the config service here, so that the config service loaded here is available
        { provide: ConfigService, useValue: configService },
      ],
    });
  })
  .then(async (appRef) => {
    const sqljsService = appRef.injector.get(SqljsService);
    await sqljsService.init();

    App.addListener('appStateChange', async ({ isActive }) => {
      // If the app is active, ensure the SQLite connection is established
      // This is useful for scenarios where the app might go to the background and come back
      console.log('App state changed:', isActive ? 'Active' : 'Inactive');
      if (isActive) {
        await sqljsService.ensureConnection();
      }
    });
  });
