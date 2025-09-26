import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, IonButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { feather } from '../../../assets/core/icon/feather';
import { leaf } from '../../../assets/core/icon/leaf';
import { SpeciesType } from 'app/models/species.model';
import { ConfigService } from 'app/services/config.service';

@Component({
  selector: 'app-landing',
  templateUrl: 'landing.page.html',
  standalone: true,
  imports: [CommonModule, IonContent, IonButton, IonIcon],
})
export class LandingPage {
  SpeciesType = SpeciesType;
  mainMenuLabel: string = '';

  constructor(
    private router: Router,
    private configService: ConfigService
  ) {
    addIcons({ feather, leaf });
    this.mainMenuLabel = this.configService.get('mainMenuLabel') ?? 'Birds & Plants';
  }

  navigateToExplore(type: SpeciesType) {
    this.router.navigateByUrl(`/tabs/tab1/${type === SpeciesType.Bird ? 'birds' : 'plants'}`, {
      replaceUrl: true,
    });
  }
}
