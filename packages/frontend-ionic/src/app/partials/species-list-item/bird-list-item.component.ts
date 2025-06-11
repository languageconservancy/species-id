import { Component } from '@angular/core';
import { IonButton, IonIcon } from '@ionic/angular/standalone';
import { BaseSpeciesListItemComponent } from './base-species-list-item.component';
import { SpeciesListItemComponent } from './species-list-item.component';

@Component({
  selector: 'app-bird-list-item',
  templateUrl: './bird-list-item.component.html',
  standalone: true,
  imports: [IonButton, IonIcon, SpeciesListItemComponent],
})
export class BirdListItemComponent extends BaseSpeciesListItemComponent {
  playAudio() {
    // Implement bird audio playback
    console.log('Playing bird audio for:', this.item.nameLocal);
  }
}
