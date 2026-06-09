import { Component, ElementRef, ViewChild } from '@angular/core';
import { RouterModule } from '@angular/router';
import {
  IonMenu,
  IonContent,
  IonList,
  IonItem,
  IonIcon,
  IonLabel,
  IonListHeader,
  IonFabButton,
  ModalController,
} from '@ionic/angular/standalone';
import { SettingsPage } from 'app/pages/settings/settings.page';
import { addIcons } from 'ionicons';
import { bird } from '../../../assets/core/icon/bird';
import { leaf } from '../../../assets/core/icon/leaf';
import {
  search,
  settings,
  informationCircle,
  close,
  chevronBack,
  chevronDown,
  home,
} from 'ionicons/icons';
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
    IonFabButton,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
  ],
})
export class MainMenuComponent {
  @ViewChild('menuListScroll') menuListScroll?: ElementRef<HTMLElement>;

  mainMenuLabel: string = '';
  /** Bottom fade: more menu items below the fold. */
  showScrollFade = false;
  /** Chevron hint when the list overflows and is not scrolled to the end. */
  showScrollHint = false;

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
      chevronDown,
      home,
    });
  }

  onMenuDidOpen(): void {
    requestAnimationFrame(() => {
      this.updateScrollAffordance();
      requestAnimationFrame(() => this.updateScrollAffordance());
    });
  }

  updateScrollAffordance(): void {
    const el = this.menuListScroll?.nativeElement;
    if (!el) {
      this.showScrollFade = false;
      this.showScrollHint = false;
      return;
    }
    const canScroll = el.scrollHeight > el.clientHeight + 4;
    const atEnd = el.scrollTop + el.clientHeight >= el.scrollHeight - 8;
    this.showScrollFade = canScroll && !atEnd;
    this.showScrollHint = canScroll && !atEnd;
  }

  scrollMenuToEnd(): void {
    const el = this.menuListScroll?.nativeElement;
    if (!el) {
      return;
    }
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
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
