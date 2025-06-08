import { Component, EnvironmentInjector, inject } from '@angular/core';
import {
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel,
  MenuController,
  IonSearchbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { triangle, ellipse, square, search, menu, filter } from 'ionicons/icons';
import { SearchService } from 'app/services/search.service';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { filter as rxjsFilter } from 'rxjs/operators';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel, IonSearchbar],
})
export class TabsPage {
  public environmentInjector = inject(EnvironmentInjector);
  public enableSearch = false;
  private router = inject(Router);

  constructor(
    private menuController: MenuController,
    private searchService: SearchService
  ) {
    this._getRouteData();
    addIcons({ triangle, ellipse, square, search, menu, filter });
  }

  private _getRouteData() {
    this.router.events.pipe(rxjsFilter((event) => event instanceof NavigationEnd)).subscribe(() => {
      const childRoute = this._getDeepestChild(this.router.routerState.root);
      this.enableSearch = childRoute.snapshot.data['enableSearch'] || false;
    });
  }

  private _getDeepestChild(route: ActivatedRoute): ActivatedRoute {
    while (route.firstChild) {
      route = route.firstChild;
    }
    return route;
  }

  openMenu() {
    console.log('Opening main menu');
    this.menuController.open('main-menu');
  }

  openFilters() {}

  searchChanged(event: CustomEvent) {
    const searchTerm = event.detail.value;
    this.searchService.setSearch(searchTerm);
  }
}
