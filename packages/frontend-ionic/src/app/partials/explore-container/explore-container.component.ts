import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IonList, IonImg, IonItem, IonLabel, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { chevronForward } from 'ionicons/icons';

import { Species } from 'app/models/species.model';
import { ParamsService } from 'app/services/params.service';
import { BirdQueriesService } from 'app/services/bird-queries.service';
import { PlantQueriesService } from 'app/services/plant-queries.service';
import { SpeciesService } from 'app/services/species.service';

@Component({
  selector: 'app-explore-container',
  templateUrl: './explore-container.component.html',
  styleUrls: ['./explore-container.component.scss'],
  imports: [IonList, IonImg, IonItem, IonLabel, IonIcon, RouterModule],
  standalone: true,
})
export class ExploreContainerComponent {
  @Input() name?: string;
  items: Species[] = [];

  constructor(
    private paramsService: ParamsService,
    private birdQueriesService: BirdQueriesService,
    private plantQueriesService: PlantQueriesService,
    public speciesService: SpeciesService
  ) {
    addIcons({ chevronForward });
  }

  async ngOnInit() {
    this._loadSpecies();
  }

  private async _loadSpecies() {
    switch (this.paramsService.getParams().speciesType) {
      case 'bird':
        this.items = await this.birdQueriesService.getFull();
        break;
      case 'plant':
        this.items = await this.plantQueriesService.getPlantsFull();
        break;
      default:
        console.warn('Unknown species type, loading birds by default');
        this.items = await this.birdQueriesService.getFull();
    }
  }
}
