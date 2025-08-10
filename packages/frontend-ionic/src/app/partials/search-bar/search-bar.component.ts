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
import { IonSearchbar, IonIcon, ModalController, IonSpinner } from '@ionic/angular/standalone';
import { search, options, mic, stop } from 'ionicons/icons';
import { SpeciesType } from 'app/models/species.model';
import { addIcons } from 'ionicons';
import { Subscription } from 'rxjs';
import { RecordingState } from 'app/services/search.service';
import { ASSET_PATHS } from 'app/constants/app-consts';

@Component({
  selector: 'app-search-bar',
  templateUrl: './search-bar.component.html',
  styleUrls: ['./search-bar.component.scss'],
  standalone: true,
  imports: [IonSearchbar, IonIcon, IonSpinner],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SearchBarComponent implements OnInit, OnDestroy {
  @Input() domain: SpeciesType = SpeciesType.Bird;
  @ViewChild('searchBar') searchBar!: IonSearchbar;

  public RecordingStateEnum = RecordingState;
  public recordingState: RecordingState = RecordingState.NotRecording;
  private subscription: Subscription = new Subscription();
  public showRecordingMaxDurationToast = false;

  constructor(
    public searchService: SearchService,
    private modalController: ModalController
  ) {
    addIcons({ search, options, mic, stop });
  }

  ngOnInit() {
    // Subscribe to the isRecording observable
    this.subscription.add(
      this.searchService.recordingState$.subscribe((recordingState) => {
        this.recordingState = recordingState;
        if (recordingState === RecordingState.ConvertingBecauseMaxDurationReached) {
          this.showRecordingMaxDurationToast = true;
        }
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
      console.error(ASSET_PATHS.ERROR_EMOJI, 'Error setting search input:', error);
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
    if (this.recordingState === RecordingState.Recording) {
      await this.searchService.stopRecording(true);
    } else {
      await this.searchService.startRecording();
    }
  }
}
