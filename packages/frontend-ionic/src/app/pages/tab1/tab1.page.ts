import { Component, OnInit } from '@angular/core';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonSearchbar,
  IonIcon,
  ModalController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { search, options } from 'ionicons/icons';
import { BirdExploreContainerComponent } from 'app/partials/explore-container/bird-explore-container.component';
import { PlantExploreContainerComponent } from 'app/partials/explore-container/plant-explore-container.component';
import { SearchService } from 'app/services/search.service';
import { OptionsComponent } from 'app/modals/options/options.component';
import { ActivatedRoute } from '@angular/router';
import { SpeciesType } from 'app/models/species.model';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonSearchbar,
    IonIcon,
    IonTitle,
    IonContent,
    BirdExploreContainerComponent,
    PlantExploreContainerComponent,
  ],
})
export class Tab1Page implements OnInit {
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
    console.log('Tab1Page ngOnInit');
    this._setDomain();
  }

  private _setDomain() {
    this.domain = (this.route.snapshot.params['domain'] as SpeciesType) ?? SpeciesType.Bird;
    console.log('Domain: ', this.domain);
  }

  searchChanged(event: CustomEvent) {
    const searchTerm = event.detail.value;
    this.searchService.setSearch(searchTerm);
  }

  async openOptionsModal() {
    const modal = await this.modalController.create({
      component: OptionsComponent,
      presentingElement: await this.modalController.getTop(),
      breakpoints: [0, 1],
      initialBreakpoint: 1,
    });
    await modal.present();
  }
}
