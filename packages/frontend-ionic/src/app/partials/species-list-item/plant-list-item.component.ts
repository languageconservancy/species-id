import { Component } from '@angular/core';
import { IonChip, IonIcon, IonLabel } from '@ionic/angular/standalone';
import { BaseSpeciesListItemComponent } from './base-species-list-item.component';
import { SpeciesListItemComponent } from './species-list-item.component';

@Component({
  selector: 'app-plant-list-item',
  templateUrl: './plant-list-item.component.html',
  standalone: true,
  imports: [IonChip, IonIcon, IonLabel, SpeciesListItemComponent],
})
export class PlantListItemComponent extends BaseSpeciesListItemComponent {}
