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
            path: ':domain',
            loadComponent: () => import('app/pages/tab1/tab1.page').then((m) => m.Tab1Page),
          },
          {
            path: 'bird/:id',
            loadComponent: () =>
              import('app/pages/bird-detail/bird-detail.page').then((m) => m.BirdDetailPage),
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
        redirectTo: '/tabs/tab1/bird',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '',
    redirectTo: '/tabs/tab1/bird',
    pathMatch: 'full',
  },
];
