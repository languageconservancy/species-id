import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent } from '@ionic/angular/standalone';
import { Species } from 'app/models/species.model';
import { PlantQueriesService } from 'app/services/plant-queries.service';
import { SpeciesService } from 'app/services/species.service';
import { TextAudioQueriesService } from 'app/services/text-audio-queries.service';
import { volumeHigh } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { ImageCarouselComponent } from 'app/partials/image-carousel/image-carousel.component';
import { DetailDescriptionComponent } from 'app/partials/detail-description/detail-description.component';
import { BackButtonComponent } from 'app/partials/back-button/back-button.component';
import { SettingsService, AppSettings } from 'app/services/settings.service';
import { Subscription } from 'rxjs';
import { ASSET_PATHS } from 'app/constants/app-consts';

@Component({
  selector: 'app-plant-detail',
  templateUrl: './plant-detail.page.html',
  styleUrls: ['./plant-detail.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    CommonModule,
    FormsModule,
    ImageCarouselComponent,
    DetailDescriptionComponent,
    BackButtonComponent,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class PlantDetailPage implements OnInit, OnDestroy {
  species: Species | null = null;
  loading = true;
  settings: AppSettings = {
    useEnglish: true,
    showScientificNames: true,
  };
  protected subscribers: Subscription = new Subscription();
  constructor(
    private route: ActivatedRoute,
    private plantQueriesService: PlantQueriesService,
    public speciesService: SpeciesService,
    private textAudioService: TextAudioQueriesService,
    private settingsService: SettingsService
  ) {
    addIcons({ volumeHigh });
  }

  async ngOnInit() {
    console.log('PlantDetailPage ngOnInit');
    await this._loadSpeciesFromUrl();
    this.loading = false;
    this._subscribeToSettings();
  }

  ngOnDestroy() {
    this.subscribers.unsubscribe();
  }

  private async _loadSpeciesFromUrl() {
    const id: number = +(this.route.snapshot.paramMap.get('id') ?? -1);
    console.log('Loading species with ID:', id);
    if (isNaN(id) || id < 0) {
      console.error(ASSET_PATHS.ERROR_EMOJI, 'Invalid route parameters: { id: ', id, ' }');
      return;
    }
    try {
      this.species = await this.plantQueriesService.getById(id);
      console.log('Loaded species from DB:', this.species);
    } catch (error) {
      console.error(ASSET_PATHS.ERROR_EMOJI, 'Error loading species:', error);
    }
  }

  public async playTextAudio(text: string | undefined) {
    if (!text) {
      console.warn(ASSET_PATHS.WARNING_EMOJI, 'No text provided for audio playback');
      return;
    }

    try {
      const textAudio = await this.textAudioService.getByText(text);
      if (textAudio) {
        const audio = new Audio(`${ASSET_PATHS.SPECIES_AUDIOS}/texts/${textAudio.fileName}`);
        audio
          .play()
          .catch((error) => console.error(ASSET_PATHS.ERROR_EMOJI, 'Error playing audio:', error));
      } else {
        console.warn(ASSET_PATHS.WARNING_EMOJI, `No audio found for text: ${text}`);
      }
    } catch (error) {
      console.error(ASSET_PATHS.ERROR_EMOJI, 'Error playing text audio:', error);
    }
  }

  private _subscribeToSettings() {
    const sub = this.settingsService.getSettings().subscribe((settings: AppSettings) => {
      this.settings = settings;
    });
    this.subscribers.add(sub);
  }
}
