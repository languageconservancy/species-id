import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { PlantQueriesService } from 'app/services/plant-queries.service';
import { PlantPreferencesService } from 'app/services/plant-preferences.service';
import { BaseExploreContainerComponent } from './base-explore-container.page';
import { Species, SpeciesGroup } from 'app/models/species.model';
import { SpeciesService } from 'app/services/species.service';
import { PlantListItemComponent } from 'app/partials/plant-list-item/plant-list-item.component';
import { SearchService } from 'app/services/search.service';
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
import { SearchBarComponent } from 'app/partials/search-bar/search-bar.component';

@Component({
  selector: 'app-plant-explore-container-page',
  templateUrl: './plant-explore-container.page.html',
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
    PlantListItemComponent,
    IonLabel,
    SearchBarComponent,
  ],
})
export class PlantExploreContainerPage
  extends BaseExploreContainerComponent
  implements OnInit, OnDestroy
{
  private preferencesSubscription?: Subscription;

  constructor(
    private plantQueriesService: PlantQueriesService,
    private plantPreferencesService: PlantPreferencesService,
    protected override speciesService: SpeciesService,
    protected override searchService: SearchService
  ) {
    super(speciesService, searchService);
  }

  override ngOnInit() {
    super.ngOnInit();
    // Subscribe to preference changes
    this.preferencesSubscription = this.plantPreferencesService
      .getPreferences()
      .subscribe((preferences) => {
        console.log('Preferences changed:', preferences);
        this._setItems();
      });
  }

  override ngOnDestroy() {
    this.preferencesSubscription?.unsubscribe();
    super.ngOnDestroy();
  }

  protected override async _loadSpecies() {
    console.log('PlantExploreContainerComponent _loadSpecies');
    try {
      this.itemsAll = await this.plantQueriesService.getFull();
      this._setItems();
    } catch (error) {
      console.error('Error loading plants:', error);
    } finally {
      this.itemsLoading = false;
    }
  }

  protected override async _groupAndSortItems(items: Species[]): Promise<SpeciesGroup[]> {
    const preferences = await this.plantPreferencesService.getSort();
    const sortType = preferences;

    const getGroupKey = (item: Species): string => {
      switch (sortType) {
        case 'alphabetical-local':
          return item.nameLocal.charAt(0).toUpperCase();
        case 'alphabetical-english':
          return item.nameEn.charAt(0).toUpperCase();
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
      .sort((a, b) => a.name.localeCompare(b.name));
  }
}
