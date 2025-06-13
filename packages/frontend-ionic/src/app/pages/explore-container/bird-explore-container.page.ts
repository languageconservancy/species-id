import { Component, OnInit, OnDestroy } from '@angular/core';
import { BirdQueriesService } from 'app/services/bird-queries.service';
import { BirdPreferencesService } from 'app/services/bird-preferences.service';
import { BaseExploreContainerComponent } from './base-explore-container.page';
import { BirdListItemComponent } from '../../partials/bird-list-item/bird-list-item.component';
import { Species, SpeciesGroup } from 'app/models/species.model';
import { SpeciesService } from 'app/services/species.service';
import { SearchService } from 'app/services/search.service';
import { SpeciesType } from 'app/models/species.model';
import {
  IonList,
  IonItemGroup,
  IonItemDivider,
  IonLabel,
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
} from '@ionic/angular/standalone';
import { Subscription } from 'rxjs';
import { SearchBarComponent } from 'app/partials/search-bar/search-bar.component';

@Component({
  selector: 'app-bird-explore-container-page',
  templateUrl: './bird-explore-container.page.html',
  styleUrls: ['./base-explore-container.component.scss'],
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonList,
    IonItemGroup,
    IonItemDivider,
    BirdListItemComponent,
    IonLabel,
    SearchBarComponent,
  ],
})
export class BirdExploreContainerPage
  extends BaseExploreContainerComponent
  implements OnInit, OnDestroy
{
  private preferencesSubscription?: Subscription;
  public speciesType = SpeciesType;
  constructor(
    private birdQueriesService: BirdQueriesService,
    private birdPreferencesService: BirdPreferencesService,
    protected override speciesService: SpeciesService,
    protected override searchService: SearchService
  ) {
    super(speciesService, searchService);
  }

  override ngOnInit() {
    super.ngOnInit();
    this.preferencesSubscription = this.birdPreferencesService.getPreferences().subscribe(() => {
      // We don't need the preferences here, since we get them in _groupAndSortItems()
      this._setItems();
    });
  }

  override ngOnDestroy() {
    this.preferencesSubscription?.unsubscribe();
    super.ngOnDestroy();
  }

  protected override async _loadSpecies() {
    this.itemsAll = await this.birdQueriesService.getFull();
    this._setItems();
    this.itemsLoading = false;
  }

  protected override async _groupAndSortItems(items: Species[]): Promise<SpeciesGroup[]> {
    const sortType = await this.birdPreferencesService.getSort();
    const sortDirection = await this.birdPreferencesService.getSortDirection();

    const getGroupKey = (item: Species): string => {
      switch (sortType) {
        case 'alphabetical-local':
          return item.nameLocal.charAt(0).toUpperCase();
        case 'alphabetical-english':
          return item.nameEn.charAt(0).toUpperCase();
        case 'by-order':
          return `${item.order?.nameScientific} (${item.order?.descriptionEn})` || 'Unknown';
        default:
          console.error('Invalid sort type:', sortType);
          return item.nameLocal.charAt(0).toUpperCase();
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
      .sort((a, b) => {
        const result = a.name.localeCompare(b.name);
        return sortDirection === 'ascending' ? result : -result;
      });
  }
}
