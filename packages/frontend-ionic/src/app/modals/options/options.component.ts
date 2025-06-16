import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonContent,
  IonToolbar,
  IonButtons,
  IonTitle,
  IonIcon,
  IonButton,
  IonList,
  IonItem,
  IonLabel,
  IonFooter,
  ModalController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { close, checkmarkCircle, refreshCircle } from 'ionicons/icons';
import { PreferencesFactory } from 'app/services/preferences.factory';
import { SpeciesType } from 'app/models/species.model';
import {
  BasePreferencesService,
  SortOption,
  FilterOption,
} from 'app/services/base-preferences.service';
import { createAnimation } from '@ionic/angular';

@Component({
  selector: 'app-options',
  templateUrl: './options.component.html',
  styleUrls: ['./options.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonContent,
    IonToolbar,
    IonButtons,
    IonTitle,
    IonIcon,
    IonButton,
    IonList,
    IonItem,
    IonLabel,
    IonFooter,
    FormsModule,
  ],
})
export class OptionsComponent implements OnInit, OnChanges {
  @Input() domain!: SpeciesType;
  selectedSort: string = '';
  sortOptions: SortOption[] = [];
  selectedFilter: string = 'all';
  filterOptions: FilterOption[] = [];
  selectedSortDirection: string = 'ascending';
  sortDirectionOptions: string[] = ['ascending', 'descending'];
  private preferencesService!: BasePreferencesService;

  constructor(
    private modalController: ModalController,
    private preferencesFactory: PreferencesFactory
  ) {
    addIcons({ close, checkmarkCircle, refreshCircle });
  }

  ngOnInit() {
    this.preferencesService = this.preferencesFactory.getPreferencesService(this.domain);
    this.loadPreferences();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['domain']) {
      this.preferencesService = this.preferencesFactory.getPreferencesService(this.domain);
      this.loadPreferences();
    }
  }

  private async loadPreferences() {
    this.selectedSort = await this.preferencesService.getSort();
    const filters = await this.preferencesService.getFilters();
    this.selectedFilter = filters['filter'] || 'all';
    this.selectedSortDirection = await this.preferencesService.getSortDirection();
    this.sortOptions = this.preferencesService.getSortOptions();
    this.filterOptions = this.preferencesService.getFilterOptions();
  }

  async applyOptions() {
    await this.preferencesService.setSort(this.selectedSort);
    await this.preferencesService.setFilters({ filter: this.selectedFilter });
    await this.preferencesService.setSortDirection(this.selectedSortDirection);
    return this.modalController.dismiss();
  }

  async resetOptions() {
    this.selectedSort = this.sortOptions[0].value;
    this.selectedFilter = 'all';
    this.selectedSortDirection = 'ascending';
    await this.preferencesService.clearAll();
  }

  close() {
    return this.modalController.dismiss();
  }
}
