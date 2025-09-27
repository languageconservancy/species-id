import { Component, OnInit, Input } from '@angular/core';
import { IonImg } from '@ionic/angular/standalone';
import { Species } from 'app/models/species.model';
import { SpeciesService } from 'app/services/species.service';
import { ASSET_PATHS } from 'app/constants/app-consts';

@Component({
  selector: 'app-species-map',
  templateUrl: './species-map.component.html',
  styleUrls: ['./species-map.component.scss'],
  standalone: true,
  imports: [IonImg],
})
export class SpeciesMapComponent implements OnInit {
  @Input() species!: Species;
  mapImageUrl: string = '';

  constructor(public speciesService: SpeciesService) {}

  async ngOnInit() {
    try {
      this.mapImageUrl = await this.speciesService.getMapImageUrl(
        this.species.mapImage,
        this.species.type
      );
    } catch (error) {
      console.error(ASSET_PATHS.ERROR_EMOJI, 'Error loading map image URL:', error);
      this.mapImageUrl = '';
    }
  }
}
