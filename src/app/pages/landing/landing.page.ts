import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent, IonButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { bird } from '../../../assets/core/icon/bird';
import { leaf } from '../../../assets/core/icon/leaf';
import { SpeciesType } from 'app/models/species.model';
import { ConfigService } from 'app/services/config.service';
import { APP_VERSION } from 'app/constants/app-consts';

@Component({
  selector: 'app-landing',
  templateUrl: 'landing.page.html',
  standalone: true,
  imports: [CommonModule, IonContent, IonButton, IonIcon],
})
export class LandingPage {
  SpeciesType = SpeciesType;
  mainMenuLabel: string = '';
  landingSubtitle: string = '';
  domainLabelBird: string = 'Birds';
  domainLabelPlant: string = 'Plants';
  readonly appVersion = APP_VERSION;

  constructor(
    private router: Router,
    private configService: ConfigService
  ) {
    addIcons({ bird, leaf });
    this.mainMenuLabel = this.configService.get('mainMenuLabel') ?? 'Species ID';
    this.landingSubtitle = this.configService.get('landingSubtitle') ?? 'A guide to species in your region.';
    const labels = this.configService.getDomainLabels();
    this.domainLabelBird = labels.bird ?? 'Birds';
    this.domainLabelPlant = labels.plant ?? 'Plants';
  }

  navigateToExplore(type: SpeciesType) {
    this.router.navigateByUrl(`/tabs/${type === SpeciesType.Bird ? 'birds' : 'plants'}`, {
      replaceUrl: true,
    });
  }
}
