import { Component, Input } from '@angular/core';
import { IonIcon, IonImg, IonItem, IonLabel, NavController } from '@ionic/angular/standalone';
import { Species } from 'app/models/species.model';
import { SpeciesService } from 'app/services/species.service';

@Component({
  selector: 'app-plant-list-item',
  templateUrl: './plant-list-item.component.html',
  standalone: true,
  imports: [IonIcon, IonLabel, IonItem, IonImg],
})
export class PlantListItemComponent {
  @Input() item!: Species;

  constructor(
    public speciesService: SpeciesService,
    public navController: NavController
  ) {}

  onItemClick(item: Species) {
    this.navController.navigateForward(['/tabs/tab1', item.type, item.id], {
      animationDirection: 'forward',
    });
  }
}
