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
import { SearchService } from 'app/services/search.service';
import { Subscription } from 'rxjs';

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
  itemsAll: Species[] = [];
  subscribers: Subscription = new Subscription();

  constructor(
    private paramsService: ParamsService,
    private birdQueriesService: BirdQueriesService,
    private plantQueriesService: PlantQueriesService,
    public speciesService: SpeciesService,
    public searchService: SearchService
  ) {
    addIcons({ chevronForward });
    this.paramsService.setParams({
      enableSearch: true,
    });
  }

  ngOnInit() {
    this._loadSpecies();
    this._subscribeAndHandleSearches();
  }

  ngOnDestroy() {
    this.paramsService.setParams({
      enableSearch: false,
    });
    this.searchService.setSearch('');
    this.subscribers.unsubscribe();
  }

  private _subscribeAndHandleSearches() {
    const sub = this.searchService.search$.subscribe((searchTerm: string) => {
      console.log('Search term:', searchTerm);
      searchTerm = searchTerm.toLowerCase().trim();
      if (searchTerm) {
        this.items = this.itemsAll.filter((item) => {
          return (
            item.nameLocal.toLowerCase().includes(searchTerm) ||
            item.nameScientific.toLowerCase().includes(searchTerm) ||
            item.nameEn.toLowerCase().includes(searchTerm)
          );
        });
      } else {
        this.items = [...this.itemsAll];
      }
    });
    this.subscribers.add(sub);
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
}
