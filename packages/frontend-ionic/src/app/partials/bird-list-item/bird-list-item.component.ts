import { Component, Input } from '@angular/core';
import { IonIcon, IonImg, IonItem, IonLabel, NavController } from '@ionic/angular/standalone';
import { Species } from 'app/models/species.model';
import { SpeciesService } from 'app/services/species.service';
import { chevronForward } from 'ionicons/icons';
import { addIcons } from 'ionicons';

@Component({
  selector: 'app-bird-list-item',
  templateUrl: './bird-list-item.component.html',
  standalone: true,
  imports: [IonIcon, IonImg, IonLabel, IonItem],
})
export class BirdListItemComponent {
  @Input() item!: Species;

  constructor(
    public speciesService: SpeciesService,
    public navController: NavController
  ) {
    addIcons({ chevronForward });
  }

  onItemClick(item: Species) {
    this.navController.navigateForward(['/tabs/tab1', item.type, item.id], {
      animationDirection: 'forward',
      animated: true,
    });
  }
}
