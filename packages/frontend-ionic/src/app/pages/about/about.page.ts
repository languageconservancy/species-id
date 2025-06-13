import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonIcon,
  IonButton,
  NavController,
  IonButtons,
  IonFooter,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { close } from 'ionicons/icons';
import { environment as env } from 'environments/environment';

@Component({
  selector: 'app-about',
  templateUrl: './about.page.html',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonIcon,
    IonButton,
    IonFooter,
  ],
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
