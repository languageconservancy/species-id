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
      return;
    }

    this.imageUrls = [];
    for (const image of this.species.images) {
      try {
        const url = await this.speciesService.getImageUrl(image.fileName, this.species.type);
        this.imageUrls.push(url);
      } catch (error) {
        console.error('Error loading image URL:', error);
        this.imageUrls.push('');
      }
    }
  }
}
