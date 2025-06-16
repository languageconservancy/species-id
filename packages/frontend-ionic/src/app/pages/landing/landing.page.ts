import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButton,
  IonIcon,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { bird } from '../../../assets/icon/bird';
import { leaf } from 'ionicons/icons';
import { environment as env } from 'environments/environment';
import { SpeciesType } from 'app/models/species.model';

@Component({
  selector: 'app-landing',
  templateUrl: 'landing.page.html',
  standalone: true,
  imports: [CommonModule, IonContent, IonButton, IonIcon],
})
export class LandingPage {
  env = env;
  SpeciesType = SpeciesType;

  constructor(private router: Router) {
    addIcons({ bird, leaf });
  }

  navigateToExplore(type: SpeciesType) {
    this.router.navigate(['/tabs/tab1', type === SpeciesType.Bird ? 'birds' : 'plants']);
  }
}
