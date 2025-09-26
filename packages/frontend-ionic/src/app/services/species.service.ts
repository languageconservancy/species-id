import { Injectable } from '@angular/core';
import { SpeciesType } from 'app/models/species.model';
import { ASSET_PATHS } from 'app/constants/app-consts';

@Injectable({
  providedIn: 'root',
})
export class SpeciesService {
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
        console.error(ASSET_PATHS.ERROR_EMOJI, `Invalid species type: ${speciesType}`);
        return '';
    }

    // Return the bundled asset path
    const assetUrl = `${ASSET_PATHS.SPECIES_IMAGES}/${imagePath}`;
    return assetUrl;
  }
}
