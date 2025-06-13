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

  async openOptionsModal() {
    const modal = await this.modalController.create({
      component: OptionsComponent,
      componentProps: {
        domain: this.domain,
      },
      presentingElement: await this.modalController.getTop(),
      breakpoints: [0, 1],
      initialBreakpoint: 1,
      backdropDismiss: true,
      showBackdrop: true,
      cssClass: 'options-modal',
      enterAnimation: (baseEl: any) => {
        const backdropAnimation = createAnimation()
          .addElement(baseEl.querySelector('ion-backdrop')!)
          .fromTo('opacity', '0.01', 'var(--backdrop-opacity)');

        const wrapperAnimation = createAnimation()
          .addElement(baseEl.querySelector('.modal-wrapper')!)
          .fromTo('transform', 'translateY(100%)', 'translateY(0%)');

        return createAnimation()
          .addElement(baseEl)
          .easing('ease-out')
          .duration(300)
          .addAnimation([backdropAnimation, wrapperAnimation]);
      },
      leaveAnimation: (baseEl: any) => {
        const backdropAnimation = createAnimation()
          .addElement(baseEl.querySelector('ion-backdrop')!)
          .fromTo('opacity', 'var(--backdrop-opacity)', '0.01');

        const wrapperAnimation = createAnimation()
          .addElement(baseEl.querySelector('.modal-wrapper')!)
          .fromTo('transform', 'translateY(0%)', 'translateY(100%)');

        return createAnimation()
          .addElement(baseEl)
          .easing('ease-in')
          .duration(300)
          .addAnimation([backdropAnimation, wrapperAnimation]);
      },
    });
    await modal.present();
  }
}
