import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { OptionsComponent } from 'app/modals/options/options.component';
import { SearchService } from 'app/services/search.service';
import { IonSearchbar, IonIcon, ModalController } from '@ionic/angular/standalone';
import { search, options } from 'ionicons/icons';
import { ActivatedRoute } from '@angular/router';
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
export class SearchBarComponent implements OnInit {
  public domain: SpeciesType = SpeciesType.Bird;
  public speciesType = SpeciesType;
  constructor(
    private searchService: SearchService,
    private modalController: ModalController,
    private route: ActivatedRoute
  ) {
    addIcons({ search, options });
  }

  async ngOnInit() {
    this._setDomain();
  }

  private _setDomain() {
    this.domain = (this.route.snapshot.params['domain'] as SpeciesType) ?? SpeciesType.Bird;
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
