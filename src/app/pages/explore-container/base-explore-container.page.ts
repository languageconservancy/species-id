import { ChangeDetectorRef, Component, inject, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Species, SpeciesGroup } from 'app/models/species.model';
import { SpeciesService } from 'app/services/species.service';
import { SearchBarService } from 'app/services/search-bar.service';
import { FuzzySearchService } from 'app/services/fuzzy-search.service';
import { Subscription, merge } from 'rxjs';
import { auditTime } from 'rxjs/operators';
import { addIcons } from 'ionicons';
import { search, options } from 'ionicons/icons';
import { AnalyticsService } from 'app/services/analytics.service';
import { SearchFields, DEFAULT_SEARCH_FIELDS } from 'app/services/base-preferences.service';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import {
  buildExploreFlatRows,
  collectExploreDividerIndices,
  ExploreFlatRow,
  findActiveDividerByViewportTop,
  trackExploreFlatRow,
} from 'app/utils/explore-flat-rows';

@Component({
  template: '',
  styleUrls: ['./base-explore-container.component.scss'],
  standalone: true,
})
export abstract class BaseExploreContainerComponent implements OnDestroy, OnInit {
  /** When true, an invisible overlay is shown to absorb the tap that dismissed the keyboard. */
  showDismissOverlay = false;

  itemsLoading = true;
  items: Species[] = [];
  itemsAll: Species[] = [];
  itemsGrouped: SpeciesGroup[] = [];
  exploreFlatRows: ExploreFlatRow[] = [];
  private exploreDividerIndices: number[] = [];
  readonly trackExploreRow = trackExploreFlatRow;
  /** Current section label for the virtual-scroll sticky header overlay. */
  stickyGroup: SpeciesGroup | null = null;
  protected virtualScrollViewport?: CdkVirtualScrollViewport;
  private virtualScrollStickySub?: Subscription;
  private stickyHeaderSyncRaf = 0;
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly ngZone = inject(NgZone);
  protected subscribers: Subscription = new Subscription();
  searchTerm: string = '';
  /** Effective search-field flags after combining per-domain toggles with global settings. */
  protected effectiveSearchFields: SearchFields = { ...DEFAULT_SEARCH_FIELDS };
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

  @ViewChild('virtualScrollViewport')
  set virtualScrollViewportRef(viewport: CdkVirtualScrollViewport | undefined) {
    this.virtualScrollViewport = viewport;
    if (viewport) {
      this._attachVirtualScrollStickyHeader();
    } else {
      this.virtualScrollStickySub?.unsubscribe();
      this.stickyGroup = null;
    }
  }

  /** Rebuild flat virtual rows after grouping changes and refresh sticky header state. */
  protected _rebuildExploreFlatRows(): void {
    this.exploreFlatRows = buildExploreFlatRows(this.itemsGrouped);
    this.exploreDividerIndices = collectExploreDividerIndices(this.exploreFlatRows);
    this._scheduleVirtualScrollStickyHeaderSync();
  }

  protected _attachVirtualScrollStickyHeader(): void {
    const viewport = this.virtualScrollViewport;
    if (!viewport) {
      return;
    }
    this.virtualScrollStickySub?.unsubscribe();
    this.virtualScrollStickySub = merge(viewport.elementScrolled(), viewport.renderedRangeStream)
      .pipe(auditTime(0))
      .subscribe(() => this._scheduleVirtualScrollStickyHeaderSync());
    this._scheduleVirtualScrollStickyHeaderSync();
  }

  protected _scheduleVirtualScrollStickyHeaderSync(): void {
    if (this.stickyHeaderSyncRaf) {
      cancelAnimationFrame(this.stickyHeaderSyncRaf);
    }
    this.stickyHeaderSyncRaf = requestAnimationFrame(() => {
      this.stickyHeaderSyncRaf = 0;
      this._syncVirtualScrollStickyHeader();
    });
  }

  protected _syncVirtualScrollStickyHeader(): void {
    const viewport = this.virtualScrollViewport;
    if (!viewport || this.exploreFlatRows.length === 0) {
      this._setStickyGroup(null);
      return;
    }

    const scrollTop = viewport.measureScrollOffset('top');
    if (scrollTop <= 1) {
      this._setStickyGroup(null);
      return;
    }

    const viewportTop = viewport.elementRef.nativeElement.getBoundingClientRect().top;
    const rowViewportTop = (index: number): number | null => {
      const el = viewport.elementRef.nativeElement.querySelector(
        `[data-explore-row-index="${index}"]`
      ) as HTMLElement | null;
      return el ? el.getBoundingClientRect().top : null;
    };

    let group = findActiveDividerByViewportTop(
      this.exploreFlatRows,
      this.exploreDividerIndices,
      viewportTop,
      rowViewportTop
    );

    if (!group) {
      const firstDivider = this.exploreFlatRows.find((row) => row.kind === 'divider');
      group = firstDivider?.kind === 'divider' ? firstDivider.group : null;
    }

    this._setStickyGroup(group);
  }

  private _setStickyGroup(group: SpeciesGroup | null): void {
    if (this.stickyGroup === group) {
      return;
    }
    this.ngZone.run(() => {
      this.stickyGroup = group;
      this.cdr.markForCheck();
    });
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
    if (this.stickyHeaderSyncRaf) {
      cancelAnimationFrame(this.stickyHeaderSyncRaf);
    }
    this.virtualScrollStickySub?.unsubscribe();
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

  protected _applySearch(): { exactMatches: Species[], fuzzyMatches: Species[] } {
    const fields = this.effectiveSearchFields;
    const exactMatches = this.itemsAll.filter((item: Species) => {
      // Crow/local name is always searched; other fields gated by effectiveSearchFields
      // (which combines per-domain toggles with global app settings).
      return (
        this.fuzzySearchService.includesExactMatch(this.searchTerm, item.nameLocal) ||
        (fields.scientific &&
          this.fuzzySearchService.includesExactMatch(this.searchTerm, item.nameScientific)) ||
        (fields.english &&
          this.fuzzySearchService.includesExactMatch(this.searchTerm, item.nameEn)) ||
        (fields.meaning &&
          this.fuzzySearchService.includesExactMatch(this.searchTerm, item.nameMeaningEn))
      );
    });
    // Check for fuzzy matches in just the local language names
    const fuzzyMatches = this.itemsAll.filter((item: Species) => {
      return this.fuzzySearchService.matches(this.searchTerm, item.nameLocal);
    });

    return { exactMatches, fuzzyMatches };
  }

  /**
   * Sort a flat list using the same field and direction as the non-search explore list
   * (within-group sort from {@link _groupAndSortItems}).
   */
  protected abstract _sortSearchResultItems(items: Species[]): Promise<Species[]>;

  protected _applyFilters(items: Species[]): Species[] {
    return items;
  }

  protected async _resetItems() {
    this.items = [...this.itemsAll];
    this.itemsGrouped = await this._groupAndSortItems(this.items);
  }

  protected async _setItems() {
    if (!this.searchTerm) {
      this.items = this.itemsAll;
      this.items = this._removeDuplicates(this.items);
      this.items = this._applyFilters(this.items);
      this.itemsGrouped = await this._groupAndSortItems(this.items);
    } else {
      let { exactMatches, fuzzyMatches } = this._applySearch();
      exactMatches = this._removeDuplicates(exactMatches);
      fuzzyMatches = this._removeDuplicates(fuzzyMatches);
      const exactNameLocals = new Set(exactMatches.map((s) => s.nameLocal));
      fuzzyMatches = fuzzyMatches.filter((item) => !exactNameLocals.has(item.nameLocal));
      exactMatches = this._applyFilters(exactMatches);
      fuzzyMatches = this._applyFilters(fuzzyMatches);
      exactMatches = await this._sortSearchResultItems(exactMatches);
      fuzzyMatches = await this._sortSearchResultItems(fuzzyMatches);
      this.itemsGrouped = [
        {
          name: 'Exact Matches',
          items: exactMatches,
        },
        {
          name: 'Near Matches',
          items: fuzzyMatches,
        },
      ];
    }

  }

  protected _removeDuplicates(items: Species[]): Species[] {
    return items.filter((item, index, self) =>
      index === self.findIndex((t) => t.nameLocal === item.nameLocal)
    );
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
