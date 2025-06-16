import { Component, Input } from '@angular/core';
import { IonFab, IonFabButton, IonIcon, NavController } from '@ionic/angular/standalone';
import { arrowBack } from 'ionicons/icons';
import { addIcons } from 'ionicons';

@Component({
  selector: 'app-back-button',
  templateUrl: './back-button.component.html',
  standalone: true,
  imports: [IonFab, IonFabButton, IonIcon],
  styles: [
    `
      ion-fab-button {
        --background: #b7f399;
        --background-activated: #87d361;
        --background-hover: #a3e681;
        --box-shadow: 0px 1px 2px 0px rgba(0, 0, 0, 0.3), 0px 1px 3px 1px rgba(0, 0, 0, 0.15);
        --color: black;
      }
    `,
  ],
})
export class BackButtonComponent {
  @Input() addBottomSafePadding = true;

  constructor(private navController: NavController) {
    addIcons({ arrowBack });
  }

  goBack() {
    this.navController.back();
  }
}
