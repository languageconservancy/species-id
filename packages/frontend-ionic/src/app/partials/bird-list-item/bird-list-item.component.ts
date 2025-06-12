import { Component, Input } from '@angular/core';
import { IonIcon, IonImg, IonItem, IonLabel, NavController } from '@ionic/angular/standalone';
import { Species } from 'app/models/species.model';
import { SpeciesService } from 'app/services/species.service';
import { chevronForward } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { ParamsService } from 'app/services/params.service';

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
    public navController: NavController,
    private paramsService: ParamsService
  ) {
    addIcons({ chevronForward });
  }

  onItemClick(item: Species) {
    this.paramsService.setParams({ species: item });
    this.navController.navigateForward(['/tabs/tab1', item.type, item.id], {
      animationDirection: 'forward',
    });
  }
}
