import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription, combineLatest } from 'rxjs';
import { PlantQueriesService } from 'app/services/plant-queries.service';
import { PlantPreferencesService } from 'app/services/plant-preferences.service';
import { BaseExploreContainerComponent } from './base-explore-container.page';
import { Plant, Species, SpeciesGroup } from 'app/models/species.model';
import { SpeciesService } from 'app/services/species.service';
import { PlantListItemComponent } from 'app/partials/plant-list-item/plant-list-item.component';
import { SearchBarService } from 'app/services/search-bar.service';
import { SpeciesType } from 'app/models/species.model';
import { IonList, IonItemGroup, IonLabel, IonContent } from '@ionic/angular/standalone';
import { SearchBarComponent } from 'app/partials/search-bar/search-bar.component';
import { HeaderComponent } from 'app/partials/header/header.component';
import { ListDividerComponent } from 'app/partials/list-divider/list-divider.component';
import { AnalyticsService } from 'app/services/analytics.service';
import { FuzzySearchService } from 'app/services/fuzzy-search.service';
import { ASSET_PATHS } from 'app/constants/app-consts';
import { ConfigService } from 'app/services/config.service';
import { mergeAdjacentSpeciesListItems } from 'app/utils/merge-adjacent-species-list-items';
import { SettingsService } from 'app/services/settings.service';
import { LoaderService } from 'app/services/loader.service';

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
  public sortType = 'alphabetical-local';
  private selectedFilter = 'all';

  get domainLabel(): string {
    return this.configService.getDomainLabels().plant ?? 'Plants';
  }

  constructor(
    private plantQueriesService: PlantQueriesService,
    private plantPreferencesService: PlantPreferencesService,
    private configService: ConfigService,
    private settingsService: SettingsService,
    private loader: LoaderService,
    protected override speciesService: SpeciesService,
    protected override searchBarService: SearchBarService,
    protected override fuzzySearchService: FuzzySearchService,
    protected override analyticsService: AnalyticsService
  ) {
    super(speciesService, searchBarService, fuzzySearchService, analyticsService);
  }

  override ngOnInit() {
    super.ngOnInit();
    this.preferencesSubscription = combineLatest([
      this.plantPreferencesService.getPreferences(),
      this.settingsService.getSettings(),
    ]).subscribe(([preferences, appSettings]) => {
      this.selectedFilter = preferences.filters['filter'] || 'all';
      this.effectiveSearchFields = {
        english: preferences.searchFields.english && appSettings.useEnglish,
        scientific: preferences.searchFields.scientific && appSettings.showScientificNames,
        meaning: preferences.searchFields.meaning,
      };
      this._setItems();
    });
  }

  override ngOnDestroy() {
    this.preferencesSubscription?.unsubscribe();
    super.ngOnDestroy();
  }

  protected override async _setItems(): Promise<void> {
    await super._setItems();
    this._postProcessPlantExploreGroups();
  }

  /** Merge adjacent same-species rows for the rendered list. */
  private _postProcessPlantExploreGroups(): void {
    this.itemsGrouped = this.itemsGrouped.map((group) => ({
      name: group.name,
      items: mergeAdjacentSpeciesListItems(group.items),
    }));
  }

  protected override async _loadSpecies() {
    this.loader.begin();
    try {
      this.itemsAll = await this.plantQueriesService.getFull();
      this._setItems();
    } catch (error) {
      console.error(ASSET_PATHS.ERROR_EMOJI, 'Error loading plants:', error);
    } finally {
      this.loader.end();
      this.itemsLoading = false;
    }
  }

  protected override async _groupAndSortItems(items: Species[]): Promise<SpeciesGroup[]> {
    this.sortType = await this.plantPreferencesService.getSort();
    const sortDirection = await this.plantPreferencesService.getSortDirection();

    const getGroupKey = (item: Species): string => {
      switch (this.sortType) {
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
          console.error(ASSET_PATHS.ERROR_EMOJI, 'Invalid sort type:', this.sortType);
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
      .map(([name, groupItems]) => ({
        name,
        items: groupItems.sort((a, b) => {
          const result = this._sortKeyForListItem(a).localeCompare(this._sortKeyForListItem(b));
          return sortDirection === 'ascending' ? result : -result;
        }),
      }))
      .sort((a, b) => {
        const result = a.name.localeCompare(b.name);
        return sortDirection === 'ascending' ? result : -result;
      });
  }

  protected override async _sortSearchResultItems(items: Species[]): Promise<Species[]> {
    this.sortType = await this.plantPreferencesService.getSort();
    const sortDirection = await this.plantPreferencesService.getSortDirection();
    return [...items].sort((a, b) => {
      const result = this._sortKeyForListItem(a).localeCompare(this._sortKeyForListItem(b));
      return sortDirection === 'ascending' ? result : -result;
    });
  }

  private _sortKeyForListItem(item: Species): string {
    switch (this.sortType) {
      case 'alphabetical-local':
        return item.nameLocal;
      case 'alphabetical-english':
        return item.nameEn;
      case 'alphabetical-latin':
        return item.nameScientific;
      case 'by-category':
        return item.nameLocal;
      default:
        return item.nameLocal;
    }
  }

  protected override _applyFilters(items: Species[]): Species[] {
    if (this.selectedFilter === 'all') {
      return items;
    }

    return items.filter((item) => item.category?.trim() === this.selectedFilter);
  }
}
