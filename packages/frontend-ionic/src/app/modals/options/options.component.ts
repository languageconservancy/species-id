import { Component, OnInit } from '@angular/core';
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

@Component({
  selector: 'app-options',
  templateUrl: './options.component.html',
  styleUrls: ['./options.component.scss'],
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
export class OptionsComponent implements OnInit {
  selectedSort: string = 'alphabetical-local';
  sortOptions: string[] = ['alphabetical-local', 'alphabetical-english', 'by-order'];
  selectedFilter: string = 'all';
  filterOptions: string[] = ['all', 'endangered', 'threatened'];
  selectedSortDirection: string = 'ascending';
  sortDirectionOptions: string[] = ['ascending', 'descending'];

  constructor(private modalController: ModalController) {
    addIcons({ close, checkmarkCircle, refreshCircle });
  }

  ngOnInit() {}

  ngAfterViewInit() {
    console.log('Footer present?', !!document.querySelector('ion-footer'));
  }

  filterChanged() {
    console.log('Filter changed to', this.selectedFilter);
  }

  sortChanged() {
    console.log('Sort changed to', this.selectedSort);
  }

  sortDirectionChanged() {
    console.log('Sort direction changed to', this.selectedSortDirection);
  }

  applyOptions() {
    console.log(
      'Applying options',
      this.selectedSort,
      this.selectedFilter,
      this.selectedSortDirection
    );
  }

  resetOptions() {
    console.log('Resetting options');
  }

  close() {
    console.log('Closing options');
    return this.modalController.dismiss();
  }
}
