import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { Species } from 'app/models/species.model';
import { SpeciesService } from 'app/services/species.service';
import { ASSET_PATHS } from 'app/constants/app-consts';

@Component({
  selector: 'app-image-carousel',
  templateUrl: './image-carousel.component.html',
  styleUrls: ['./image-carousel.component.scss'],
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ImageCarouselComponent implements OnInit, OnChanges {
  @Input() species: Species | null = null;
  imageUrls: string[] = [];
  imageLoadStates: { [index: number]: 'loading' | 'loaded' | 'error' } = {};

  constructor(public speciesService: SpeciesService) {}

  ngOnInit() {
    // Initial load will be handled by ngOnChanges
  }

  ngOnChanges(changes: SimpleChanges) {
    // Watch for changes to the species property
    if (changes['species'] && changes['species'].currentValue) {
      this._loadImageUrls();
    }
  }

  private async _loadImageUrls() {
    if (!this.species?.images) {
      this.imageUrls = [];
      this.imageLoadStates = {};
      return;
    }

    this.imageUrls = [];
    this.imageLoadStates = {};
    for (let i = 0; i < this.species.images.length; i++) {
      const image = this.species.images[i];
      this.imageLoadStates[i] = 'loading';
      try {
        const url = await this.speciesService.getImageUrl(image.fileName, this.species.type);
        this.imageUrls.push(url);
      } catch (error) {
        console.error(ASSET_PATHS.ERROR_EMOJI, 'Error loading image URL:', error);
        this.imageUrls.push('');
        this.imageLoadStates[i] = 'error';
      }
    }
  }

  onImageLoad(index: number) {
    this.imageLoadStates[index] = 'loaded';
  }

  onImageError(index: number) {
    this.imageLoadStates[index] = 'error';
  }
}
