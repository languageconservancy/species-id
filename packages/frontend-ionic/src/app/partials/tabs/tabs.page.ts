import { Component, EnvironmentInjector, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel,
  MenuController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { bird } from '../../../assets/core/icon/bird';
import { triangle, ellipse, square, search, menu, options, leaf } from 'ionicons/icons';
import { Router, NavigationEnd } from '@angular/router';
import { filter as rxjsFilter } from 'rxjs/operators';
import { SpeciesType } from 'app/models/species.model';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, RouterLink],
})
export class TabsPage {
  public environmentInjector = inject(EnvironmentInjector);
  private router = inject(Router);
  exploreIcon = 'bird';
  speciesType = SpeciesType;
  currentDomain: SpeciesType = SpeciesType.Bird;

  constructor(private menuController: MenuController) {
    addIcons({ triangle, ellipse, square, search, menu, options, bird, leaf });
    this._getRouteData();
  }

  private _getRouteData() {
    this.router.events.pipe(rxjsFilter((event) => event instanceof NavigationEnd)).subscribe(() => {
      const url = this.router.url;
      if (url.includes('/birds')) {
        this.currentDomain = SpeciesType.Bird;
        this.exploreIcon = 'bird';
      } else if (url.includes('/plants')) {
        this.currentDomain = SpeciesType.Plant;
        this.exploreIcon = 'leaf';
      }
    });
  }

  openMenu() {
    console.log('Opening main menu');
    this.menuController.open('main-menu');
  }
}
