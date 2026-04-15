import {
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
  ViewChild,
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
  @ViewChild('swiperEl', { static: false }) swiperEl?: ElementRef<HTMLElement>;
  imageUrls: string[] = [];
  imageLoadStates: { [index: number]: 'loading' | 'loaded' | 'error' } = {};
  canSlidePrev = false;
  canSlideNext = false;

  constructor(public speciesService: SpeciesService) {}

  ngOnInit() {
    // Initial load will be handled by ngOnChanges
  }

  ngOnChanges(changes: SimpleChanges) {
    // Watch for changes to the species property
    if (changes['species'] && changes['species'].currentValue) {
      this._loadImageUrls();
      this.canSlidePrev = false;
      this.canSlideNext = (this.species?.images?.length ?? 0) > 1;
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

  slidePrev(): void {
    const swiper = (this.swiperEl?.nativeElement as any)?.swiper;
    swiper?.slidePrev();
  }

  slideNext(): void {
    const swiper = (this.swiperEl?.nativeElement as any)?.swiper;
    swiper?.slideNext();
  }

  onSwiperStateChange(): void {
    this._updateNavState();
  }

  private _updateNavState(): void {
    const swiper = (this.swiperEl?.nativeElement as any)?.swiper;
    if (!swiper) {
      return;
    }
    this.canSlidePrev = !swiper.isBeginning;
    this.canSlideNext = !swiper.isEnd;
  }
}
