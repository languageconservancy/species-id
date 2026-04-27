import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  Input,
  OnInit,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { OptionsComponent } from 'app/modals/options/options.component';
import { SearchBarService } from 'app/services/search-bar.service';
import { IonSearchbar, IonIcon, ModalController } from '@ionic/angular/standalone';
import { search, options, mic, stop } from 'ionicons/icons';
import { SpeciesType } from 'app/models/species.model';
import { addIcons } from 'ionicons';
import { Subscription } from 'rxjs';
import { RecordingState } from 'app/services/search-bar.service';
import { ASSET_PATHS } from 'app/constants/app-consts';

@Component({
  selector: 'app-search-bar',
  templateUrl: './search-bar.component.html',
  styleUrls: ['./search-bar.component.scss'],
  standalone: true,
  imports: [IonSearchbar, IonIcon],
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
    public searchBarService: SearchBarService,
    private modalController: ModalController
  ) {
    addIcons({ search, options, mic, stop });
  }

  ngOnInit() {
    // Subscribe to the isRecording observable
    this.subscription.add(
      this.searchBarService.recordingState$.subscribe((recordingState) => {
        this.recordingState = recordingState;
        if (recordingState === RecordingState.ConvertingBecauseMaxDurationReached) {
          this.showRecordingMaxDurationToast = true;
        }
      })
    );

    // Subscribe to recording text updates
    this.subscription.add(
      this.searchBarService.recordingText$.subscribe((text) => {
        this.setSearchInput(text);
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  searchChanged(event: CustomEvent) {
    const searchTerm = event.detail.value;
    this.searchBarService.setSearch(searchTerm);
  }

  onSearchFocus(): void {
    this.searchBarService.notifySearchFocus();
    this._attachEnterKeyBlur();
  }

  onSearchBlur(): void {
    this.searchBarService.notifySearchBlur();
  }

  /** Blur the search input so Return key dismisses the keyboard (template keydown may not fire from shadow DOM). */
  private async _attachEnterKeyBlur(): Promise<void> {
    try {
      const input = await this.searchBar.getInputElement();
      const handler = (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          input.blur();
        }
      };
      input.addEventListener('keydown', handler, { once: true });
    } catch {
      // ignore
    }
  }

  onSearchKeydownEnter(event: Event): void {
    const e = event as KeyboardEvent;
    e.preventDefault();
    (e.target as HTMLInputElement | null)?.blur();
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
      this.searchBarService.setSearch(searchTerm);
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
      await this.searchBarService.stopRecording(true);
    } else {
      await this.searchBarService.startRecording();
    }
  }
}
