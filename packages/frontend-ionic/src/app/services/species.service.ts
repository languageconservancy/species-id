import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SpeciesService {
  constructor() {}

  getImageUrl(imageFileName: string): string {
    // Assuming images are stored in a specific directory
    return `assets/images/${imageFileName}`;
  }
}
