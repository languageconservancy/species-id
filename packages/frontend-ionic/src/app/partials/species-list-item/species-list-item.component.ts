import { Component, Input } from '@angular/core';
import { NavController, IonItem, IonLabel, IonImg, IonIcon } from '@ionic/angular/standalone';
import { Species } from 'app/models/species.model';
import { SpeciesService } from 'app/services/species.service';

@Component({
  selector: 'app-species-list-item',
  templateUrl: './species-list-item.component.html',
  standalone: true,
  imports: [IonItem, IonLabel, IonImg, IonIcon],
})
export class SpeciesListItemComponent {
  @Input() item!: Species;

  constructor(
    public speciesService: SpeciesService,
    private navController: NavController
  ) {}

  onItemClick(item: Species) {
    this.navController.navigateForward(['/tabs/tab1', item.type, item.id], {
      animationDirection: 'forward',
    });
  }
}
