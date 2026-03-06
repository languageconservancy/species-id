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
  IonFab,
  IonFabButton,
  ModalController,
} from '@ionic/angular/standalone';
import { SettingsPage } from 'app/pages/settings/settings.page';
import { addIcons } from 'ionicons';
import { bird } from '../../../assets/core/icon/bird';
import { leaf } from '../../../assets/core/icon/leaf';
import { search, settings, informationCircle, close, chevronBack, home } from 'ionicons/icons';
import { Router } from '@angular/router';
import { ConfigService } from 'app/services/config.service';

interface MenuItem {
  label: string;
  icon: string;
  link: string;
  /** When set, use img instead of ion-icon (project icon from species-data). */
  iconUrl?: string;
}

@Component({
  selector: 'app-main-menu',
  templateUrl: './main-menu.component.html',
  styleUrls: ['./main-menu.component.scss'],
  standalone: true,
  imports: [
    IonMenu,
    IonContent,
    IonList,
    IonItem,
    IonIcon,
    IonLabel,
    IonListHeader,
    RouterModule,
    IonFab,
    IonFabButton,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
  ],
})
export class MainMenuComponent {
  mainMenuLabel: string = '';

  get menuItems(): MenuItem[] {
    const labels = this.configService.getDomainLabels();
    const iconUrls = this.configService.getDomainIconUrls();
    return [
      { label: 'Home', icon: 'home', link: '/' },
      {
        label: labels.bird ?? 'Birds',
        icon: 'bird',
        link: '/tabs/birds',
        iconUrl: iconUrls?.bird ?? undefined,
      },
      {
        label: labels.plant ?? 'Plants',
        icon: 'leaf',
        link: '/tabs/plants',
        iconUrl: iconUrls?.plant ?? undefined,
      },
      { label: 'About', icon: 'information-circle', link: '/tabs/about' },
    ];
  }

  constructor(
    private router: Router,
    private modalController: ModalController,
    public configService: ConfigService
  ) {
    this.mainMenuLabel = this.configService.get('mainMenuLabel') ?? 'Species ID';
    // Add icons to the menu
    addIcons({
      leaf,
      search,
      settings,
      informationCircle,
      bird,
      close,
      chevronBack,
      home,
    });
  }

  menuItemClicked(link: string) {
    this.router.navigate([link]);
    this.closeMenu();
  }

  closeMenu() {
    const menu = document.querySelector('ion-menu');
    if (menu) {
      menu.close();
    }
  }

  onWillDismiss() {
    this.closeMenu();
  }

  async openSettingsModal() {
    const modal = await this.modalController.create({
      component: SettingsPage,
      presentingElement: await this.modalController.getTop(),
      breakpoints: [0, 1],
      initialBreakpoint: 1,
    });
    await modal.present();
  }
}
