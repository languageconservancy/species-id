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
            path: '',
            loadComponent: () => import('app/pages/tab1/tab1.page').then((m) => m.Tab1Page),
            data: { enableSearch: true },
          },
          {
            path: 'detail/:type/:id',
            loadComponent: () => import('app/pages/detail/detail.page').then((m) => m.DetailPage),
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
        redirectTo: '/tabs/tab1',
        pathMatch: 'full',
        data: { enableSearch: true },
      },
    ],
  },
  {
    path: '',
    redirectTo: '/tabs/tab1',
    pathMatch: 'full',
    data: { enableSearch: true },
  },
];
