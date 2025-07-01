import { Injectable } from '@angular/core';
import { SpeciesType } from 'app/models/species.model';

@Injectable({
  providedIn: 'root',
})
export class SpeciesService {
  private readonly baseUrl = 'assets/images';

  constructor() {
    // No initialization needed for bundled assets
  }

  async getImageUrl(imageFileName: string, speciesType?: SpeciesType): Promise<string> {
    // Build the path based on species type
    let imagePath: string;
    switch (speciesType) {
      case SpeciesType.Bird:
        imagePath = `birds/${imageFileName}`;
        break;
      case SpeciesType.Plant:
        imagePath = `plants/${imageFileName}`;
        break;
      default:
        console.error(`Invalid species type: ${speciesType}`);
        return '';
    }

    // Return the bundled asset path
    const assetUrl = `${this.baseUrl}/${imagePath}`;
    console.log(`SpeciesService: Using bundled asset URL: ${assetUrl}`);
    return assetUrl;
  }
}
