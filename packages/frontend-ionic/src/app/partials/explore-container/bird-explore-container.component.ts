import { Component, OnInit } from '@angular/core';
import { BirdQueriesService } from 'app/services/bird-queries.service';
import { BirdPreferencesService } from 'app/services/bird-preferences.service';
import { BaseExploreContainerComponent } from './base-explore-container.component';
import { BirdListItemComponent } from '../species-list-item/bird-list-item.component';
import { Species, SpeciesGroup } from 'app/models/species.model';
import { SpeciesService } from 'app/services/species.service';
import { SearchService } from 'app/services/search.service';
import {
  IonList,
  IonItem,
  IonLabel,
  IonItemGroup,
  IonItemDivider,
} from '@ionic/angular/standalone';
import { BirdSortOption } from 'app/constants/bird-options';

@Component({
  selector: 'app-bird-explore-container',
  templateUrl: './bird-explore-container.component.html',
  styleUrls: ['./base-explore-container.component.scss'],
  standalone: true,
  imports: [IonList, IonItem, IonLabel, IonItemGroup, IonItemDivider, BirdListItemComponent],
})
export class BirdExploreContainerComponent extends BaseExploreContainerComponent implements OnInit {
  constructor(
    private birdQueriesService: BirdQueriesService,
    private birdPreferencesService: BirdPreferencesService,
    protected override speciesService: SpeciesService,
    protected override searchService: SearchService
  ) {
    console.log('BirdExploreContainerComponent constructor');
    super(speciesService, searchService);
  }

  protected override async _loadSpecies() {
    console.log('BirdExploreContainerComponent _loadSpecies');
    this.itemsAll = await this.birdQueriesService.getFull();
    console.log('Birds: ', this.itemsAll);
    this._setItems([...this.itemsAll]);
  }

  protected override async _groupItems(items: Species[]): Promise<SpeciesGroup[]> {
    const sortType: BirdSortOption = await this.birdPreferencesService.getSort();

    const getGroupKey = (item: Species): string => {
      switch (sortType) {
        case 'alphabetical-local':
          return item.nameLocal.charAt(0).toUpperCase();
        case 'alphabetical-english':
          return item.nameEn.charAt(0).toUpperCase();
        case 'by-order':
          return item.order?.nameScientific || 'Unknown';
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
