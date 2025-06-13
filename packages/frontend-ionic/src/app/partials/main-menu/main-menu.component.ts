import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import {
  IonMenu,
  IonContent,
  IonList,
  IonItem,
  IonIcon,
  IonLabel,
  IonListHeader,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { bird } from '../../../assets/icon/bird';
import { leaf, search, settings, informationCircle, close, chevronBack } from 'ionicons/icons';
import { environment as env } from 'environments/environment';
import { Router } from '@angular/router';

interface MenuItem {
  label: string;
  icon: string;
  link: string;
}

@Component({
  selector: 'app-main-menu',
  templateUrl: './main-menu.component.html',
  styleUrls: ['./main-menu.component.scss'],
  standalone: true,
  imports: [IonMenu, IonContent, IonList, IonItem, IonIcon, IonLabel, IonListHeader, RouterModule],
})
export class MainMenuComponent {
  env = env;
  // Define the menu items
  menuItems: MenuItem[] = [
    {
      label: 'Birds',
      icon: 'bird',
      link: '/tabs/tab1/birds',
    },
    {
      label: 'Plants',
      icon: 'leaf',
      link: '/tabs/tab1/plants',
    },
    {
      label: 'About',
      icon: 'information-circle',
      link: '/about',
    },
    {
      label: 'Settings',
      icon: 'settings',
      link: '/tabs/tab3',
    },
  ];
  constructor(private router: Router) {
    // Add icons to the menu
    addIcons({
      leaf,
      search,
      settings,
      informationCircle,
      bird,
      close,
      chevronBack,
    });
  }

  menuItemClicked(link: string) {
    // Navigate to the selected menu item using Angular Router
    console.log('menuItemClicked: ', link);
    this.router.navigate([link]);
    // Close the menu after navigation
    this.closeMenu();
  }

  closeMenu() {
    const menu = document.querySelector('ion-menu');
    if (menu) {
      menu.close();
    }
  }
}
