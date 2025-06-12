import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
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
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class PlantDetailPage implements OnInit {
  species: Species | null = null;
  loading = true;
  constructor(
    private route: ActivatedRoute,
    private plantQueriesService: PlantQueriesService,
    public speciesService: SpeciesService,
    private textAudioService: TextAudioQueriesService
  ) {
    addIcons({ volumeHigh });
  }

  async ngOnInit() {
    console.log('PlantDetailPage ngOnInit');
    await this._loadSpeciesFromUrl();
    this.loading = false;
  }

  private async _loadSpeciesFromUrl() {
    const id: number = +(this.route.snapshot.paramMap.get('id') ?? -1);
    console.log('Loading species with ID:', id);
    if (isNaN(id) || id < 0) {
      console.error('Invalid route parameters: { id: ', id, ' }');
      return;
    }
    try {
      this.species = await this.plantQueriesService.getById(id);
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
        const audio = new Audio(`assets/audio/${textAudio.fileName}`);
        audio.play().catch((error) => console.error('Error playing audio:', error));
      } else {
        console.warn(`No audio found for text: ${text}`);
      }
    } catch (error) {
      console.error('Error playing text audio:', error);
    }
  }
}
