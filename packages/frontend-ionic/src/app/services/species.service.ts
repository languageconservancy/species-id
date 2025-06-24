import { Injectable } from '@angular/core';
import { SpeciesType } from 'app/models/species.model';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

@Injectable({
  providedIn: 'root',
})
export class SpeciesService {
  private baseUrl = 'assets/images';

  constructor() {
    this.init();
  }

  async init() {
    try {
      const result = await Filesystem.getUri({
        path: '',
        directory: Directory.LibraryNoCloud,
      });
      this.baseUrl = result.uri;
      console.log('SpeciesService: Base URL set to:', this.baseUrl);
    } catch (error) {
      console.error('SpeciesService: Error getting base URL:', error);
      // Keep the default fallback
    }
  }

  async getImageUrl(imageFileName: string, speciesType?: SpeciesType): Promise<string> {
    // Build the path based on species type
    let imagePath: string;
    switch (speciesType) {
      case SpeciesType.Bird:
        imagePath = `birds/images/${imageFileName}`;
        break;
      case SpeciesType.Plant:
        imagePath = `plants/images/${imageFileName}`;
        break;
      default:
        console.error(`Invalid species type: ${speciesType}`);
        return '';
    }

    try {
      // Get the specific file URI for this image
      const result = await Filesystem.getUri({
        path: imagePath,
        directory: Directory.LibraryNoCloud,
      });

      console.log(`SpeciesService: ✅ Direct file URI for ${imageFileName}:`, result.uri);
      return Capacitor.convertFileSrc(result.uri);
    } catch (error) {
      console.error(`SpeciesService: ❌ Could not get file URI for ${imagePath}:`, error);

      // Fallback to constructed URL
      const fallbackUrl = `${this.baseUrl}${imagePath}`;
      console.log(`SpeciesService: Using fallback URL:`, fallbackUrl);
      return fallbackUrl;
    }
  }
}
