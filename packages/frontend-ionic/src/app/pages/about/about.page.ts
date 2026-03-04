import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, NavController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { close } from 'ionicons/icons';
import { HeaderComponent } from 'app/partials/header/header.component';
import { ConfigService } from 'app/services/config.service';
import { APP_VERSION } from 'app/constants/app-consts';

@Component({
  selector: 'app-about',
  templateUrl: './about.page.html',
  standalone: true,
  imports: [CommonModule, IonContent, HeaderComponent],
})
export class AboutPage {
  mainMenuLabel: string = '';
  readonly appVersion = APP_VERSION;

  constructor(
    private navController: NavController,
    private configService: ConfigService
  ) {
    addIcons({ close });
    this.mainMenuLabel = this.configService.get('mainMenuLabel') ?? 'Birds & Plants';
  }

  close() {
    this.navController.back();
  }
}
