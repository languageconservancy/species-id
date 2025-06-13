import { Component, CUSTOM_ELEMENTS_SCHEMA, Input } from '@angular/core';
import { OptionsComponent } from 'app/modals/options/options.component';
import { SearchService } from 'app/services/search.service';
import { IonSearchbar, IonIcon, ModalController } from '@ionic/angular/standalone';
import { search, options } from 'ionicons/icons';
import { SpeciesType } from 'app/models/species.model';
import { addIcons } from 'ionicons';

@Component({
  selector: 'app-search-bar',
  templateUrl: './search-bar.component.html',
  styleUrls: ['./search-bar.component.scss'],
  standalone: true,
  imports: [IonSearchbar, IonIcon],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SearchBarComponent {
  @Input() domain!: SpeciesType;
  public speciesType = SpeciesType;
  constructor(
    private searchService: SearchService,
    private modalController: ModalController
  ) {
    addIcons({ search, options });
  }

  searchChanged(event: CustomEvent) {
    const searchTerm = event.detail.value;
    this.searchService.setSearch(searchTerm);
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
    });
    await modal.present();
  }
}
