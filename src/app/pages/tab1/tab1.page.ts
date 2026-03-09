import { Component, OnInit } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { search, options } from 'ionicons/icons';
import { ActivatedRoute } from '@angular/router';
import { SpeciesType } from 'app/models/species.model';
import { ConfigService } from 'app/services/config.service';
import { BirdsExplorePage } from '../explore-container/birds-explore.page';
import { PlantsExplorePage } from '../explore-container/plants-explore.page';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, BirdsExplorePage, PlantsExplorePage],
})
export class Tab1Page implements OnInit {
  public domain: SpeciesType = SpeciesType.Bird;
  public speciesType = SpeciesType;

  get domainLabel(): string {
    const labels = this.configService.getDomainLabels();
    return this.domain === SpeciesType.Bird ? (labels.bird ?? 'Birds') : (labels.plant ?? 'Plants');
  }

  constructor(
    private route: ActivatedRoute,
    private configService: ConfigService
  ) {
    addIcons({ search, options });
  }

  async ngOnInit() {
    this._setDomain();
  }

  private _setDomain() {
    this.domain = (this.route.snapshot.params['domain'] as SpeciesType) ?? SpeciesType.Bird;
  }
}
