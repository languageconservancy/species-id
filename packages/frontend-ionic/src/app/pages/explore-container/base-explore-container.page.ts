import { Component, OnDestroy, OnInit } from '@angular/core';
import { Species, SpeciesGroup } from 'app/models/species.model';
import { SpeciesService } from 'app/services/species.service';
import { SearchService } from 'app/services/search.service';
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
  itemsLoading = true;
  items: Species[] = [];
  itemsAll: Species[] = [];
  itemsGrouped: SpeciesGroup[] = [];
  protected subscribers: Subscription = new Subscription();
  searchTerm: string = '';

  constructor(
    protected speciesService: SpeciesService,
    protected searchService: SearchService,
    protected analyticsService: AnalyticsService
  ) {
    addIcons({ search, options });
  }

  ngOnInit() {
    this._loadSpecies();
    this._subscribeAndHandleSearches();
  }

  ngOnDestroy() {
    this.searchService.setSearch('');
    this.subscribers.unsubscribe();
  }

  protected _subscribeAndHandleSearches() {
    const sub = this.searchService.search$.subscribe((searchTerm: string) => {
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
    return this.itemsAll.filter((item: Species) => {
      return (
        item.nameLocal.toLowerCase().includes(this.searchTerm) ||
        item.nameScientific.toLowerCase().includes(this.searchTerm) ||
        item.nameEn.toLowerCase().includes(this.searchTerm) ||
        item.nameMeaningEn.toLowerCase().includes(this.searchTerm)
      );
    });
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

  protected async _groupAndSortItems(items: Species[]): Promise<SpeciesGroup[]> {
    // To be implemented by child classes
    throw new Error('_groupAndSortItems must be implemented by child class');
  }
}
