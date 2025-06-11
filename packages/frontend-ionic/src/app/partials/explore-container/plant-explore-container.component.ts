import { Component, OnInit } from '@angular/core';
import { PlantQueriesService } from 'app/services/plant-queries.service';
import { PlantPreferencesService } from 'app/services/plant-preferences.service';
import { PlantSortOption } from 'app/constants/plant-options';
import { BaseExploreContainerComponent } from './base-explore-container.component';
import { Species, SpeciesGroup } from 'app/models/species.model';
import { SpeciesService } from 'app/services/species.service';
import { PlantListItemComponent } from 'app/partials/plant-list-item/plant-list-item.component';
import { SearchService } from 'app/services/search.service';
import {
  IonList,
  IonItem,
  IonLabel,
  IonItemGroup,
  IonItemDivider,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-plant-explore-container',
  templateUrl: './plant-explore-container.component.html',
  styleUrls: ['./base-explore-container.component.scss'],
  standalone: true,
  imports: [IonList, IonItem, IonLabel, IonItemGroup, IonItemDivider, PlantListItemComponent],
})
export class PlantExploreContainerComponent
  extends BaseExploreContainerComponent
  implements OnInit
{
  constructor(
    private plantQueriesService: PlantQueriesService,
    private plantPreferencesService: PlantPreferencesService,
    protected override speciesService: SpeciesService,
    protected override searchService: SearchService
  ) {
    super(speciesService, searchService);
  }

  protected override async _loadSpecies() {
    console.log('PlantExploreContainerComponent _loadSpecies');
    this.itemsAll = await this.plantQueriesService.getFull();
    this._setItems([...this.itemsAll]);
    this.itemsLoading = false;
  }

  protected override async _groupItems(items: Species[]): Promise<SpeciesGroup[]> {
    const sortType: PlantSortOption = await this.plantPreferencesService.getSort();

    const getGroupKey = (item: Species): string => {
      switch (sortType) {
        case 'alphabetical-local':
          return item.nameLocal.charAt(0).toUpperCase();
        case 'alphabetical-english':
          return item.nameEn.charAt(0).toUpperCase();
        default:
          return 'Unknown';
      }
    };

    const grouped = items.reduce(
      (acc, item) => {
        const key = getGroupKey(item);
        acc[key] = acc[key] || [];
        acc[key].push(item);
        return acc;
      },
      {} as Record<string, Species[]>
    );

    return Object.entries(grouped)
      .map(([name, items]) => ({ name, items }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }
}
