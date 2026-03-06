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
import { leaf } from '../../../assets/core/icon/leaf';
import { triangle, ellipse, square, search, menu, options } from 'ionicons/icons';
import { SpeciesType } from 'app/models/species.model';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, RouterLink],
})
export class TabsPage {
  public environmentInjector = inject(EnvironmentInjector);
  speciesType = SpeciesType;
  currentDomain: SpeciesType = SpeciesType.Bird;

  constructor(private menuController: MenuController) {
    addIcons({ triangle, ellipse, square, search, menu, options, bird, leaf });
    // this._getRouteData();
  }

  // private _getRouteData() {
  // this.router.events.pipe(rxjsFilter((event) => event instanceof NavigationEnd)).subscribe(() => {
  // const url = this.router.url;
  // }
  // });
  // }

  openMenu() {
    this.menuController.open('main-menu');
  }
}
