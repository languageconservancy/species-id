import { Component, OnInit, OnDestroy } from '@angular/core';
import { BirdQueriesService } from 'app/services/bird-queries.service';
import { BirdPreferencesService } from 'app/services/bird-preferences.service';
import { BaseExploreContainerComponent } from './base-explore-container.page';
import { BirdListItemComponent } from '../../partials/bird-list-item/bird-list-item.component';
import { Bird, Species, SpeciesGroup } from 'app/models/species.model';
import { SpeciesService } from 'app/services/species.service';
import { SearchBarService } from 'app/services/search-bar.service';
import { SpeciesType } from 'app/models/species.model';
import { IonList, IonItemGroup, IonLabel, IonContent } from '@ionic/angular/standalone';
import { Subscription } from 'rxjs';
import { SearchBarComponent } from 'app/partials/search-bar/search-bar.component';
import { HeaderComponent } from 'app/partials/header/header.component';
import { ListDividerComponent } from 'app/partials/list-divider/list-divider.component';
import { AnalyticsService } from 'app/services/analytics.service';
import { FuzzySearchService } from 'app/services/fuzzy-search.service';
import { ASSET_PATHS } from 'app/constants/app-consts';
import { ConfigService } from 'app/services/config.service';

@Component({
  selector: 'app-birds-explore-page',
  templateUrl: './birds-explore.page.html',
  styleUrls: ['./base-explore-container.component.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonList,
    IonItemGroup,
    BirdListItemComponent,
    IonLabel,
    SearchBarComponent,
    HeaderComponent,
    ListDividerComponent,
  ],
})
export class BirdsExplorePage extends BaseExploreContainerComponent implements OnInit, OnDestroy {
  private preferencesSubscription?: Subscription;
  public speciesType = SpeciesType;
  public sortType = 'alphabetical-local';

  get domainLabel(): string {
    return this.configService.getDomainLabels().bird ?? 'Birds';
  }

  constructor(
    private birdQueriesService: BirdQueriesService,
    private birdPreferencesService: BirdPreferencesService,
    private configService: ConfigService,
    protected override speciesService: SpeciesService,
    protected override searchBarService: SearchBarService,
    protected override fuzzySearchService: FuzzySearchService,
    protected override analyticsService: AnalyticsService
  ) {
    super(speciesService, searchBarService, fuzzySearchService, analyticsService);
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
    try {
      const result = await this.birdQueriesService.getAllBirds();
      this.itemsAll = result;
      this._setItems();
    } catch (error) {
      console.error(ASSET_PATHS.ERROR_EMOJI, 'Error loading species:', error);
    }
    this.itemsLoading = false;
  }

  /**
   * Group and sort birds by user preference.
   * @param items - The birds to group and sort.
   * @returns The grouped and sorted birds.
   */
  protected override async _groupAndSortItems(items: Species[]): Promise<SpeciesGroup[]> {
    this.sortType = await this.birdPreferencesService.getSort();
    const sortDirection = await this.birdPreferencesService.getSortDirection();

    // Get the first letter of the bird's name.
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
          return `${(item as Bird).category}` || 'Other';
        default:
          console.error(ASSET_PATHS.ERROR_EMOJI, 'Invalid sort type:', this.sortType);
          return item.nameLocal.charAt(0).toUpperCase();
      }
    };

    // Group birds by first letter of their name.
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
      switch (this.sortType) {
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
