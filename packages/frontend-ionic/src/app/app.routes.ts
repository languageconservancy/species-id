import { Routes } from '@angular/router';
import { TabsPage } from './partials/tabs/tabs.page';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('app/pages/landing/landing.page').then((m) => m.LandingPage),
  },
  {
    path: 'tabs',
    component: TabsPage,
    children: [
      {
        path: '',
        loadChildren: () => import('app/partials/tabs/tabs.routes').then((m) => m.routes),
      },
      {
        path: 'about',
        loadComponent: () => import('app/pages/about/about.page').then((m) => m.AboutPage),
      },
    ],
  },
];
