import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  Input,
  OnInit,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { OptionsComponent } from 'app/modals/options/options.component';
import { SearchService } from 'app/services/search.service';
import { IonSearchbar, IonIcon, ModalController } from '@ionic/angular/standalone';
import { search, options, mic, stop } from 'ionicons/icons';
import { SpeciesType } from 'app/models/species.model';
import { addIcons } from 'ionicons';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-search-bar',
  templateUrl: './search-bar.component.html',
  styleUrls: ['./search-bar.component.scss'],
  standalone: true,
  imports: [IonSearchbar, IonIcon],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SearchBarComponent implements OnInit, OnDestroy {
  @Input() domain!: SpeciesType;
  @ViewChild('searchBar') searchBar!: IonSearchbar;

  public speciesType = SpeciesType;
  public isRecording: boolean = false;
  private subscription = new Subscription();

  constructor(
    public searchService: SearchService,
    private modalController: ModalController
  ) {
    addIcons({ search, options, mic, stop });
  }

  ngOnInit() {
    // Subscribe to the isRecording observable
    this.subscription.add(
      this.searchService.isRecording$.subscribe((isRecording) => {
        this.isRecording = isRecording;
      })
    );

    // Subscribe to recording text updates
    this.subscription.add(
      this.searchService.recordingText$.subscribe((text) => {
        this.setSearchInput(text);
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  searchChanged(event: CustomEvent) {
    const searchTerm = event.detail.value;
    this.searchService.setSearch(searchTerm);
  }

  async setSearchInput(searchTerm: string) {
    try {
      // Get the input element from the searchbar
      const inputElement = await this.searchBar.getInputElement();
      if (inputElement) {
        inputElement.value = searchTerm;
        // Trigger the input event to update the searchbar's internal state
        inputElement.dispatchEvent(new Event('input', { bubbles: true }));
      }
      this.searchService.setSearch(searchTerm);
    } catch (error) {
      console.error('Error setting search input:', error);
    }
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

  // Helper methods for template
  async toggleRecording() {
    if (this.isRecording) {
      await this.searchService.stopRecording();
    } else {
      await this.searchService.startRecording();
    }
  }
}
