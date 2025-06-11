import { Component, Input } from '@angular/core';
import { NavController } from '@ionic/angular/standalone';
import { Species } from 'app/models/species.model';
import { SpeciesService } from 'app/services/species.service';

@Component({
  template: '',
  standalone: true,
  imports: [],
})
export class BaseSpeciesListItemComponent {
  @Input() item!: Species;

  constructor(
    public speciesService: SpeciesService,
    protected navController: NavController
  ) {}

  onItemClick(item: Species) {
    this.navController.navigateForward(['/tabs/tab1/detail', item.type, item.id], {
      animationDirection: 'forward',
    });
  }
}
