import { Component, Input, OnInit } from '@angular/core';
import { Bird, Plant, Species, SpeciesType } from 'app/models/species.model';
import { CommonModule } from '@angular/common';
import { SettingsService, AppSettings } from 'app/services/settings.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-detail-description',
  templateUrl: './detail-description.component.html',
  styleUrls: ['./detail-description.component.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class DetailDescriptionComponent implements OnInit {
  @Input() species: Species | null = null;
  @Input() settings: AppSettings = {
    useEnglish: true,
    showScientificNames: true,
  };
  protected subscribers: Subscription = new Subscription();

  constructor(private settingsService: SettingsService) {}

  ngOnInit() {
    this._subscribeToSettings();
  }

  ngOnDestroy() {
    this.subscribers.unsubscribe();
  }

  private _subscribeToSettings() {
    const sub = this.settingsService.getSettings().subscribe((settings: AppSettings) => {
      this.settings = settings;
    });
    this.subscribers.add(sub);
  }

  public isBird(species: Species | null): species is Bird {
    if (!species) {
      return false;
    }
    return species.type === SpeciesType.Bird;
  }

  public isPlant(species: Species | null): species is Plant {
    if (!species) {
      return false;
    }
    return species.type === SpeciesType.Plant;
  }
}
