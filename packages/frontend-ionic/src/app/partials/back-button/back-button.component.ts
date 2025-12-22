import { Component, Input } from '@angular/core';
import { IonFab, IonFabButton, IonIcon, NavController } from '@ionic/angular/standalone';
import { arrowBack } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { Router } from '@angular/router';
import { Location } from '@angular/common';

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
  private isNavigating = false;

  constructor(
    private navController: NavController,
    private router: Router,
    private location: Location
  ) {
    addIcons({ arrowBack });
  }

  goBack() {
    if (this.isNavigating) {
      console.log('Navigation already in progress, ignoring click');
      return;
    }

    this.isNavigating = true;
    console.log('Going back');

    // Check if we have navigation history
    if (window.history.length > 1) {
      // Try Ionic navigation first
      this.navController
        .pop()
        .catch(() => {
          // If Ionic navigation fails (e.g., no navigation stack), use browser back
          console.log('Ionic navigation failed, using browser back');
          this.location.back();
        })
        .finally(() => {
          this.resetNavigationFlag();
        });
    } else {
      // No history, navigate to a safe default (birds list)
      console.log('No navigation history, navigating to birds list');
      this.router.navigate(['/tabs/tab1/birds']).finally(() => {
        this.resetNavigationFlag();
      });
    }
  }

  private resetNavigationFlag() {
    setTimeout(() => {
      this.isNavigating = false;
    }, 300);
  }
}
