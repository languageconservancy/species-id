import { Component, OnDestroy, OnInit } from '@angular/core';
import { Species, SpeciesGroup } from 'app/models/species.model';
import { SpeciesService } from 'app/services/species.service';
import { SearchService } from 'app/services/search.service';
import { Subscription } from 'rxjs';

@Component({
  template: '',
  styleUrls: ['./base-explore-container.component.scss'],
  standalone: true,
})
export class BaseExploreContainerComponent implements OnDestroy, OnInit {
  items: Species[] = [];
  itemsAll: Species[] = [];
  itemsGrouped: SpeciesGroup[] = [];
  protected subscribers: Subscription = new Subscription();

  constructor(
    protected speciesService: SpeciesService,
    protected searchService: SearchService
  ) {}

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
      searchTerm = searchTerm.toLowerCase().trim();
      if (searchTerm) {
        this._setItems(
          this.itemsAll.filter((item) => {
            return (
              item.nameLocal.toLowerCase().includes(searchTerm) ||
              item.nameScientific.toLowerCase().includes(searchTerm) ||
              item.nameEn.toLowerCase().includes(searchTerm)
            );
          })
        );
      } else {
        this._setItems([...this.itemsAll]);
      }
    });
    this.subscribers.add(sub);
  }

  protected async _loadSpecies() {
    // To be implemented by child classes
    throw new Error('_loadSpecies must be implemented by child class');
  }

  protected async _setItems(items: Species[]) {
    this.items = items;
    this.itemsGrouped = await this._groupItems(items);
  }

  protected async _groupItems(items: Species[]): Promise<SpeciesGroup[]> {
    // To be implemented by child classes
    throw new Error('_groupItems must be implemented by child class');
  }
}
