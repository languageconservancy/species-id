import { Component, OnInit, OnDestroy, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonToolbar,
  IonButtons,
  IonIcon,
  IonButton,
  IonList,
  IonItem,
  IonLabel,
  IonFooter,
  ModalController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { close, checkmarkCircle, refreshCircle, ellipseOutline } from 'ionicons/icons';
import { Subscription } from 'rxjs';
import { PreferencesFactory } from 'app/services/preferences.factory';
import { SpeciesType } from 'app/models/species.model';
import {
  BasePreferencesService,
  SortOption,
  FilterOption,
  SearchFields,
  DEFAULT_SEARCH_FIELDS,
} from 'app/services/base-preferences.service';
import { SettingsService, AppSettings } from 'app/services/settings.service';
import { HeaderComponent } from 'app/partials/header/header.component';

interface SearchFieldRow {
  key: keyof SearchFields;
  label: string;
  /** Reason this row is forced off (hidden by global settings); empty when enabled. */
  disabledHint: string;
}

@Component({
  selector: 'app-options',
  templateUrl: './options.component.html',
  styleUrls: ['./options.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonToolbar,
    IonButtons,
    IonIcon,
    IonButton,
    IonList,
    IonItem,
    IonLabel,
    IonFooter,
    FormsModule,
    HeaderComponent,
  ],
})
export class OptionsComponent implements OnInit, OnDestroy, OnChanges {
  @Input() domain!: SpeciesType;
  selectedSort: string = '';
  sortOptions: SortOption[] = [];
  selectedFilter: string = 'all';
  filterOptions: FilterOption[] = [];
  selectedSortDirection: string = 'ascending';
  sortDirectionOptions: string[] = ['ascending', 'descending'];
  searchFields: SearchFields = { ...DEFAULT_SEARCH_FIELDS };
  searchFieldRows: SearchFieldRow[] = [
    { key: 'english', label: 'English Name', disabledHint: '' },
    { key: 'scientific', label: 'Scientific Name', disabledHint: '' },
    { key: 'meaning', label: 'Literal Meaning', disabledHint: '' },
  ];
  private preferencesService!: BasePreferencesService;
  private settingsSubscription?: Subscription;
  private appSettings: AppSettings | null = null;

  constructor(
    private modalController: ModalController,
    private preferencesFactory: PreferencesFactory,
    private settingsService: SettingsService
  ) {
    addIcons({ close, checkmarkCircle, refreshCircle, ellipseOutline });
  }

  ngOnInit() {
    this.preferencesService = this.preferencesFactory.getPreferencesService(this.domain);
    this.settingsSubscription = this.settingsService.getSettings().subscribe((settings) => {
      this.appSettings = settings;
      this._refreshSearchFieldDisabledHints();
    });
    this.loadPreferences();
  }

  ngOnDestroy(): void {
    this.settingsSubscription?.unsubscribe();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['domain']) {
      this.preferencesService = this.preferencesFactory.getPreferencesService(this.domain);
      this.loadPreferences();
    }
  }

  private async loadPreferences() {
    this.selectedSort = await this.preferencesService.getSort();
    this.selectedSortDirection = await this.preferencesService.getSortDirection();
    this.sortOptions = this.preferencesService.getSortOptions();
    this.filterOptions = await this.preferencesService.getFilterOptions();
    const filters = await this.preferencesService.getFilters();
    const savedFilter = filters['filter'] || 'all';
    const hasSavedFilter = this.filterOptions.some((option) => option.value === savedFilter);
    this.selectedFilter = hasSavedFilter ? savedFilter : 'all';

    if (!hasSavedFilter && savedFilter !== 'all') {
      await this.preferencesService.setFilters({ filter: 'all' });
    }

    this.searchFields = await this.preferencesService.getSearchFields();
    this._refreshSearchFieldDisabledHints();
  }

  private _refreshSearchFieldDisabledHints(): void {
    const hint = '(hidden by app settings)';
    const englishHidden = !!this.appSettings && !this.appSettings.useEnglish;
    const scientificHidden = !!this.appSettings && !this.appSettings.showScientificNames;
    this.searchFieldRows = this.searchFieldRows.map((row) => {
      if (row.key === 'english') {
        return { ...row, disabledHint: englishHidden ? hint : '' };
      }
      if (row.key === 'scientific') {
        return { ...row, disabledHint: scientificHidden ? hint : '' };
      }
      return { ...row, disabledHint: '' };
    });
  }

  toggleSearchField(key: keyof SearchFields, isDisabled: boolean): void {
    if (isDisabled) {
      return;
    }
    this.searchFields = { ...this.searchFields, [key]: !this.searchFields[key] };
  }

  isSearchFieldActive(row: SearchFieldRow): boolean {
    if (row.disabledHint) {
      return false;
    }
    return !!this.searchFields[row.key];
  }

  async applyOptions() {
    await this.preferencesService.setSort(this.selectedSort);
    await this.preferencesService.setFilters({ filter: this.selectedFilter });
    await this.preferencesService.setSortDirection(this.selectedSortDirection);
    await this.preferencesService.setSearchFields(this.searchFields);
    return this.modalController.dismiss();
  }

  async resetOptions() {
    this.selectedSort = this.sortOptions[0].value;
    this.selectedFilter = 'all';
    this.selectedSortDirection = 'ascending';
    this.searchFields = { ...DEFAULT_SEARCH_FIELDS };
    this._refreshSearchFieldDisabledHints();
    await this.preferencesService.clearAll();
  }

  close() {
    return this.modalController.dismiss();
  }
}
