import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  NavController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { close } from 'ionicons/icons';
import { environment as env } from 'environments/environment';
import { BackButtonComponent } from 'app/partials/back-button/back-button.component';

@Component({
  selector: 'app-about',
  templateUrl: './about.page.html',
  standalone: true,
  imports: [CommonModule, IonHeader, IonToolbar, IonTitle, IonContent, BackButtonComponent],
})
export class AboutPage {
  env = env;

  constructor(private navController: NavController) {
    addIcons({ close });
  }

  close() {
    this.navController.back();
  }
}
