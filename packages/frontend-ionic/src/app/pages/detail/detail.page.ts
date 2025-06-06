import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent } from '@ionic/angular/standalone';
import { ParamsService } from 'app/services/params.service';
import { SpeciesType, Species } from 'app/models/species.model';
import { BirdQueriesService } from 'app/services/bird-queries.service';
import { PlantQueriesService } from 'app/services/plant-queries.service';
import { SpeciesService } from 'app/services/species.service';

@Component({
  selector: 'app-detail',
  templateUrl: './detail.page.html',
  styleUrls: ['./detail.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, FormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class DetailPage implements OnInit {
  species: Species | null = null;

  constructor(
    private route: ActivatedRoute,
    private paramsService: ParamsService,
    private birdQueriesService: BirdQueriesService,
    private plantQueriesService: PlantQueriesService,
    public speciesService: SpeciesService
  ) {}

  ngOnInit() {
    let ok = this._loadSpeciesFromParams();
    if (!ok) {
      this._loadSpeciesFromUrl();
    }
  }

  private _loadSpeciesFromParams(): boolean {
    const paramSpecies: Species | undefined = this.paramsService.getParams().species;
    if (!paramSpecies) {
      return false;
    }
    this.species = paramSpecies;
    return true;
  }

  private async _loadSpeciesFromUrl() {
    const type: SpeciesType = this.route.snapshot.paramMap.get('type') as SpeciesType;
    const id: number = +(this.route.snapshot.paramMap.get('id') ?? -1);
    if (!type || isNaN(id) || id < 0) {
      console.error('Invalid route parameters: { type: ', type, ', id: ', id, ' }');
    }

    switch (type) {
      case 'bird':
        console.log('Loading bird species with ID:', id);
        this.species = await this.birdQueriesService.getById(id);
        break;
      case 'plant':
        console.log('Loading plant species with ID:', id);
        this.species = await this.plantQueriesService.getById(id);
        break;
      default:
        console.error('Unknown species type:', type);
        return;
    }

    if (this.species === null) {
      console.error(`Species with ID ${id} not found for type ${type}`);
      return;
    }
  }
}
