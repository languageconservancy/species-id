import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';
import {
  IonList,
  IonImg,
  IonItem,
  IonLabel,
  IonIcon,
  IonSearchbar,
} from '@ionic/angular/standalone';
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
  imports: [IonList, IonImg, IonItem, IonLabel, IonIcon, IonSearchbar, RouterModule],
  standalone: true,
})
export class ExploreContainerComponent {
  @Input() name?: string;
  items: Species[] = [];
  itemsAll: Species[] = [];

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
        this.itemsAll = await this.birdQueriesService.getFull();
        break;
      case 'plant':
        this.itemsAll = await this.plantQueriesService.getPlantsFull();
        break;
      default:
        console.warn('Unknown species type, loading birds by default');
        this.itemsAll = await this.birdQueriesService.getFull();
    }
    this.items = [...this.itemsAll];
  }

  onSearch(event: CustomEvent) {
    const searchTerm = (event.target as HTMLInputElement).value.toLowerCase();
    this.items = this.items.filter((item) => {
      if (
        item.nameLocal.toLowerCase().includes(searchTerm) ||
        item.nameScientific.toLowerCase().includes(searchTerm) ||
        item.nameEn.toLowerCase().includes(searchTerm)
      ) {
        return true;
      }
      return false;
    });
  }
}
