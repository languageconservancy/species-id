import { Component, EnvironmentInjector, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonIcon,
  MenuController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { bird } from '../../../assets/core/icon/bird';
import { leaf } from '../../../assets/core/icon/leaf';
import { triangle, ellipse, square, search, menu, options } from 'ionicons/icons';
import { SpeciesType } from 'app/models/species.model';
import { ConfigService } from 'app/services/config.service';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, RouterLink],
})
export class TabsPage {
  public environmentInjector = inject(EnvironmentInjector);
  speciesType = SpeciesType;
  currentDomain: SpeciesType = SpeciesType.Bird;

  get tabLabelBird(): string {
    return this.configService.getTabLabels().bird ?? 'Birds';
  }
  get tabLabelPlant(): string {
    return this.configService.getTabLabels().plant ?? 'Plants';
  }
  get iconUrlBird(): string | null {
    return this.configService.getDomainIconUrls()?.bird ?? null;
  }
  get iconUrlPlant(): string | null {
    return this.configService.getDomainIconUrls()?.plant ?? null;
  }

  constructor(
    private menuController: MenuController,
    private configService: ConfigService
  ) {
    addIcons({ triangle, ellipse, square, search, menu, options, bird, leaf });
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
