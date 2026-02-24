import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { PlantQueriesService } from 'app/services/plant-queries.service';
import { PlantPreferencesService } from 'app/services/plant-preferences.service';
import { BaseExploreContainerComponent } from './base-explore-container.page';
import { Plant, Species, SpeciesGroup } from 'app/models/species.model';
import { SpeciesService } from 'app/services/species.service';
import { PlantListItemComponent } from 'app/partials/plant-list-item/plant-list-item.component';
import { SearchService } from 'app/services/search.service';
import { SpeciesType } from 'app/models/species.model';
import { IonList, IonItemGroup, IonLabel, IonContent } from '@ionic/angular/standalone';
import { SearchBarComponent } from 'app/partials/search-bar/search-bar.component';
import { HeaderComponent } from 'app/partials/header/header.component';
import { ListDividerComponent } from 'app/partials/list-divider/list-divider.component';
import { AnalyticsService } from 'app/services/analytics.service';
import { ASSET_PATHS } from 'app/constants/app-consts';

@Component({
  selector: 'app-plants-explore-page',
  templateUrl: './plants-explore.page.html',
  styleUrls: ['./base-explore-container.component.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonList,
    IonItemGroup,
    PlantListItemComponent,
    IonLabel,
    SearchBarComponent,
    HeaderComponent,
    ListDividerComponent,
  ],
})
export class PlantsExplorePage extends BaseExploreContainerComponent implements OnInit, OnDestroy {
  private preferencesSubscription?: Subscription;
  public speciesType = SpeciesType;
  constructor(
    private plantQueriesService: PlantQueriesService,
    private plantPreferencesService: PlantPreferencesService,
    protected override speciesService: SpeciesService,
    protected override searchService: SearchService,
    protected override analyticsService: AnalyticsService
  ) {
    super(speciesService, searchService, analyticsService);
  }

  override ngOnInit() {
    super.ngOnInit();
    // Subscribe to preference changes
    this.preferencesSubscription = this.plantPreferencesService
      .getPreferences()
      .subscribe((preferences) => {
        this._setItems();
      });
  }

  override ngOnDestroy() {
    this.preferencesSubscription?.unsubscribe();
    super.ngOnDestroy();
  }

  protected override async _loadSpecies() {
    try {
      this.itemsAll = await this.plantQueriesService.getFull();
      this._setItems();
    } catch (error) {
      console.error(ASSET_PATHS.ERROR_EMOJI, 'Error loading plants:', error);
    } finally {
      this.itemsLoading = false;
    }
  }

  protected override async _groupAndSortItems(items: Species[]): Promise<SpeciesGroup[]> {
    const sortType = await this.plantPreferencesService.getSort();
    const sortDirection = await this.plantPreferencesService.getSortDirection();

    const getGroupKey = (item: Species): string => {
      switch (sortType) {
        case 'alphabetical-local':
          // Check first two letters first, since single letters will always be part of double letters.
          const firstTwoLetters: string = this._removeAccents(
            item.nameLocal.slice(0, 2).toLowerCase()
          );
          if (this.CROW_ALPHABET.includes(firstTwoLetters)) {
            // Capitalize first letter and return both letters
            return firstTwoLetters.charAt(0).toUpperCase() + firstTwoLetters.charAt(1);
          }

          const firstLetter: string = this._removeAccents(item.nameLocal.charAt(0).toLowerCase());
          if (this.CROW_ALPHABET.includes(firstLetter)) {
            // Capitalize first letter and return both letters
            return firstLetter.toUpperCase();
          }

          console.error(
            ASSET_PATHS.ERROR_EMOJI,
            'Unable to determine group key for:',
            item.nameLocal
          );
          return 'Other';
        case 'alphabetical-english':
          return item.nameEn.charAt(0).toUpperCase();
        case 'alphabetical-latin':
          return item.nameScientific.charAt(0).toUpperCase();
        case 'by-category':
          return `${(item as Plant).category}` || 'Other';
        default:
          console.error(ASSET_PATHS.ERROR_EMOJI, 'Invalid sort type:', sortType);
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

    const getSortValue = (item: Species): string => {
      switch (sortType) {
        case 'alphabetical-local':
          return item.nameLocal;
        case 'alphabetical-english':
          return item.nameEn;
        case 'alphabetical-latin':
          return item.nameScientific;
        case 'by-category':
          return item.nameLocal; // Sort by local name within category groups
        default:
          return item.nameLocal;
      }
    };

    return Object.entries(grouped)
      .map(([name, items]) => ({
        name,
        items: items.sort((a, b) => {
          const result = getSortValue(a).localeCompare(getSortValue(b));
          return sortDirection === 'ascending' ? result : -result;
        }),
      }))
      .sort((a, b) => {
        const result = a.name.localeCompare(b.name);
        return sortDirection === 'ascending' ? result : -result;
      });
  }
}
