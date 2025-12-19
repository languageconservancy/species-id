import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent } from '@ionic/angular/standalone';
import { Species } from 'app/models/species.model';
import { BirdQueriesService } from 'app/services/bird-queries.service';
import { SpeciesService } from 'app/services/species.service';
import { TextAudioQueriesService } from 'app/services/text-audio-queries.service';
import { TextAudio } from 'app/models/text-audio.model';
import { volumeHigh } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { ImageCarouselComponent } from 'app/partials/image-carousel/image-carousel.component';
import { DetailDescriptionComponent } from 'app/partials/detail-description/detail-description.component';
import { BackButtonComponent } from 'app/partials/back-button/back-button.component';
import { SettingsService, AppSettings } from 'app/services/settings.service';
import { Subscription } from 'rxjs';
import { ASSET_PATHS } from 'app/constants/app-consts';
import { SpeciesMapComponent } from 'app/partials/species-map/species-map.component';
import { SpeciesType } from 'app/models/species.model';

@Component({
  selector: 'app-bird-detail',
  templateUrl: './bird-detail.page.html',
  styleUrls: ['./bird-detail.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    CommonModule,
    FormsModule,
    ImageCarouselComponent,
    DetailDescriptionComponent,
    BackButtonComponent,
    SpeciesMapComponent,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class BirdDetailPage implements OnInit {
  species: Species | null = null;
  loading = true;
  settings: AppSettings = {
    useEnglish: true,
    showScientificNames: true,
  };
  protected subscribers: Subscription = new Subscription();
  crowNames: Array<{ name: string; audios: TextAudio[] }> = [];
  englishNames: Array<string> = [];
  latinNames: Array<string> = [];
  literalMeanings: Array<string> = [];

  constructor(
    private route: ActivatedRoute,
    private birdQueriesService: BirdQueriesService,
    public speciesService: SpeciesService,
    private textAudioService: TextAudioQueriesService,
    private settingsService: SettingsService
  ) {
    addIcons({ volumeHigh });
  }

  async ngOnInit() {
    await this._loadSpeciesFromUrl();
    await this._loadCrowNamesWithAudio();
    await this._loadEnglishNames();
    await this._loadLatinNames();
    await this._loadLiteralMeanings();
    this.loading = false;
    this._subscribeToSettings();
  }

  ngOnDestroy() {
    this.subscribers.unsubscribe();
  }

  private _subscribeToSettings() {
    const sub = this.settingsService.getSettings().subscribe((settings: AppSettings) => {
      this.settings = settings;
    });
    this.subscribers.add(sub);
  }

  private async _loadSpeciesFromUrl() {
    const id: number = +(this.route.snapshot.paramMap.get('id') ?? -1);
    if (isNaN(id) || id < 0) {
      console.error(ASSET_PATHS.ERROR_EMOJI, 'Invalid route parameters: { id: ', id, ' }');
      return;
    }

    try {
      this.species = await this.birdQueriesService.getBirdById(id);
    } catch (error) {
      console.error(ASSET_PATHS.ERROR_EMOJI, 'Error loading species:', error);
    }
  }

  private async _loadEnglishNames() {
    if (!this.species) return;
    console.log('Loading english names for species:', this.species);
    const englishNames: string[] = await this.birdQueriesService.getBirdEnglishNames(
      this.species.id
    );
    this.englishNames = englishNames;
  }

  private async _loadLatinNames() {
    if (!this.species) return;
    this.latinNames = this.species.nameScientific?.split(';') || [];
  }

  private async _loadLiteralMeanings() {
    if (!this.species) return;
    this.literalMeanings = this.species.nameMeaningEn?.split(';') || [];
  }

  private async _loadCrowNamesWithAudio() {
    if (!this.species) return;

    try {
      // Get all Crow names for this species
      const crowNames = await this.birdQueriesService.getBirdCrowNames(this.species.id);

      // Get all text audios for this species
      const textAudios = await this.textAudioService.getBySpeciesId(
        this.species.id,
        SpeciesType.Bird
      );

      // Group audios by text/crow name
      const audiosByText = new Map<string, TextAudio[]>();
      textAudios.forEach((audio) => {
        if (!audiosByText.has(audio.text)) {
          audiosByText.set(audio.text, []);
        }
        audiosByText.get(audio.text)!.push(audio);
      });

      // Map crow names with their associated audios
      this.crowNames = crowNames.map((crowName) => ({
        name: crowName.name,
        audios: audiosByText.get(crowName.name) || [],
      }));
    } catch (error) {
      console.error(ASSET_PATHS.ERROR_EMOJI, 'Error loading crow names with audio:', error);
      // Fallback to just showing the single name from species
      this.crowNames = this.species?.nameLocal
        ? [{ name: this.species.nameLocal, audios: [] }]
        : [];
    }
  }

  public async playTextAudio(textAudio: TextAudio) {
    if (!textAudio) {
      console.warn(ASSET_PATHS.WARNING_EMOJI, 'No audio provided for playback');
      return;
    }

    try {
      const audio = new Audio(
        `${ASSET_PATHS.SPECIES_DATA}/birds/text_audios/${textAudio.fileName}`
      );
      audio
        .play()
        .catch((error) => console.error(ASSET_PATHS.ERROR_EMOJI, 'Error playing audio:', error));
    } catch (error) {
      console.error(ASSET_PATHS.ERROR_EMOJI, 'Error playing text audio:', error);
    }
  }
}
