import { Component } from '@angular/core';
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
import { ExploreContainerComponent } from 'app/partials/explore-container/explore-container.component';
import { SearchService } from 'app/services/search.service';
import { OptionsComponent } from 'app/partials/options/options.component';

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
    ExploreContainerComponent,
  ],
})
export class Tab1Page {
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
    console.log('Opening options modal');
    const modal = await this.modalController.create({
      component: OptionsComponent,
      presentingElement: await this.modalController.getTop(),
      breakpoints: [0, 1],
      initialBreakpoint: 1,
    });
    await modal.present();
  }
}
