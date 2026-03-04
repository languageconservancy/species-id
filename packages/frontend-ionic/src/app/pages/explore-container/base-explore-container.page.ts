import { Component, OnDestroy, OnInit } from '@angular/core';
import { Species, SpeciesGroup } from 'app/models/species.model';
import { SpeciesService } from 'app/services/species.service';
import { SearchBarService } from 'app/services/search-bar.service';
import { FuzzySearchService } from 'app/services/fuzzy-search.service';
import { Subscription } from 'rxjs';
import { addIcons } from 'ionicons';
import { search, options } from 'ionicons/icons';
import { AnalyticsService } from 'app/services/analytics.service';

@Component({
  template: '',
  styleUrls: ['./base-explore-container.component.scss'],
  standalone: true,
})
export class BaseExploreContainerComponent implements OnDestroy, OnInit {
  /** When true, an invisible overlay is shown to absorb the tap that dismissed the keyboard. */
  showDismissOverlay = false;

  itemsLoading = true;
  items: Species[] = [];
  itemsAll: Species[] = [];
  itemsGrouped: SpeciesGroup[] = [];
  protected subscribers: Subscription = new Subscription();
  searchTerm: string = '';
  protected CROW_ALPHABET: readonly string[] = [
    'a',
    'aa',
    'b',
    'ch',
    'd',
    'e',
    'ee',
    'h',
    'i',
    'ii',
    'ia',
    'k',
    'l',
    'm',
    'n',
    'o',
    'oo',
    'p',
    's',
    'sh',
    't',
    'u',
    'uu',
    'ua',
    'w',
    'x',
  ];

  constructor(
    protected speciesService: SpeciesService,
    protected searchBarService: SearchBarService,
    protected fuzzySearchService: FuzzySearchService,
    protected analyticsService: AnalyticsService
  ) {
    addIcons({ search, options });
  }

  ngOnInit() {
    this._loadSpecies();
    this._subscribeAndHandleSearches();
    this._subscribeDismissOverlay();
  }

  private _subscribeDismissOverlay(): void {
    const sub = this.searchBarService.dismissOverlayVisibility$.subscribe((show) => {
      this.showDismissOverlay = show;
    });
    this.subscribers.add(sub);
  }

  /** Called when the invisible overlay is tapped; removes overlay and consumes the tap. */
  onDismissOverlayClick(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.showDismissOverlay = false;
  }

  ngOnDestroy() {
    this.searchBarService.setSearch('');
    this.subscribers.unsubscribe();
  }

  protected _subscribeAndHandleSearches() {
    const sub = this.searchBarService.search$.subscribe((searchTerm: string) => {
      this.searchTerm = searchTerm.toLowerCase().trim();
      if (this.searchTerm) {
        this.analyticsService.track('search', { searchTerm: this.searchTerm });
        this._setItems();
      } else {
        this._resetItems();
      }
    });
    this.subscribers.add(sub);
  }

  protected async _loadSpecies() {
    // To be implemented by child classes
    throw new Error('_loadSpecies must be implemented by child class');
  }

  protected _applySearch(): Species[] {
    if (!this.searchTerm) {
      return this.itemsAll;
    }
    const exactMatches = this.itemsAll.filter((item: Species) => {
      return (
        this.fuzzySearchService.includesExactMatch(this.searchTerm, item.nameLocal) ||
        this.fuzzySearchService.includesExactMatch(this.searchTerm, item.nameScientific) ||
        this.fuzzySearchService.includesExactMatch(this.searchTerm, item.nameEn) ||
        this.fuzzySearchService.includesExactMatch(this.searchTerm, item.nameMeaningEn)
      );
    });
    const fuzzyMatches = this.itemsAll.filter((item: Species) => {
      return this.fuzzySearchService.matches(this.searchTerm, item.nameLocal);
    });
    return [...exactMatches, ...fuzzyMatches];
  }

  protected _applyFilters(items: Species[]): Species[] {
    return items;
  }

  protected async _resetItems() {
    this.items = [...this.itemsAll];
    this.itemsGrouped = await this._groupAndSortItems(this.items);
  }

  protected async _setItems() {
    this.items = this._applySearch();
    this.items = this._applyFilters(this.items);
    this.itemsGrouped = await this._groupAndSortItems(this.items);
  }

  protected _removeAccents(text: string): string {
    const ACCENTS_MAP: Record<string, string> = {
      á: 'a',
      é: 'e',
      í: 'i',
      ó: 'o',
      ú: 'u',
    };

    let modifiedText: string = text.toLowerCase();
    Object.entries(ACCENTS_MAP).forEach(([key, value]) => {
      modifiedText = modifiedText.replace(new RegExp(key, 'g'), value);
    });
    return modifiedText;
  }

  protected async _groupAndSortItems(items: Species[]): Promise<SpeciesGroup[]> {
    // To be implemented by child classes
    throw new Error('_groupAndSortItems must be implemented by child class');
  }
}
