import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent } from '@ionic/angular/standalone';
import { Species } from 'app/models/species.model';
import { BirdQueriesService } from 'app/services/bird-queries.service';
import { SpeciesService } from 'app/services/species.service';
import { TextAudioQueriesService } from 'app/services/text-audio-queries.service';
import { volumeHigh } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { ImageCarouselComponent } from 'app/partials/image-carousel/image-carousel.component';
import { DetailDescriptionComponent } from 'app/partials/detail-description/detail-description.component';
import { BackButtonComponent } from 'app/partials/back-button/back-button.component';
import { SettingsService, AppSettings } from 'app/services/settings.service';
import { Subscription } from 'rxjs';

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
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class BirdDetailPage implements OnInit {
  species: Species | null = null;
  loading = true;
  private readonly baseUrl = 'assets/audios/texts';
  settings: AppSettings = {
    useEnglish: true,
    showScientificNames: true,
  };
  protected subscribers: Subscription = new Subscription();

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
    console.log('BirdDetailPage ngOnInit');
    await this._loadSpeciesFromUrl();
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
    console.log('Loading species with ID:', id);
    if (isNaN(id) || id < 0) {
      console.error('Invalid route parameters: { id: ', id, ' }');
      return;
    }

    try {
      this.species = await this.birdQueriesService.getById(id);
      console.log('Loaded species from DB:', this.species);
    } catch (error) {
      console.error('Error loading species:', error);
    }
  }

  public async playTextAudio(text: string | undefined) {
    if (!text) {
      console.warn('No text provided for audio playback');
      return;
    }

    try {
      const textAudio = await this.textAudioService.getByText(text);
      if (textAudio) {
        const audio = new Audio(`${this.baseUrl}/${textAudio.fileName}`);
        audio.play().catch((error) => console.error('Error playing audio:', error));
      } else {
        console.warn(`No audio found for text: ${text}`);
      }
    } catch (error) {
      console.error('Error playing text audio:', error);
    }
  }
}
