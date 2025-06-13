import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

export const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    children: [
      {
        path: 'tab1',
        children: [
          {
            path: 'birds',
            loadComponent: () =>
              import('app/pages/explore-container/bird-explore-container.page').then(
                (m) => m.BirdExploreContainerPage
              ),
          },
          {
            path: 'plants',
            loadComponent: () =>
              import('app/pages/explore-container/plant-explore-container.page').then(
                (m) => m.PlantExploreContainerPage
              ),
          },
          {
            path: 'bird/:id',
            loadComponent: () =>
              import('app/pages/bird-detail/bird-detail.page').then((m) => m.BirdDetailPage),
          },
          {
            path: 'plant/:id',
            loadComponent: () =>
              import('app/pages/plant-detail/plant-detail.page').then((m) => m.PlantDetailPage),
          },
        ],
      },
      {
        path: 'tab2',
        loadComponent: () => import('app/pages/tab2/tab2.page').then((m) => m.Tab2Page),
      },
      {
        path: 'tab3',
        loadComponent: () => import('app/pages/tab3/tab3.page').then((m) => m.Tab3Page),
      },
      {
        path: '',
        redirectTo: '/tabs/tab1/birds',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '',
    redirectTo: '/tabs/tab1/birds',
    pathMatch: 'full',
  },
];
