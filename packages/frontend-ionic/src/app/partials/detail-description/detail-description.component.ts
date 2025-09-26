import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { Species } from 'app/models/species.model';
import { IonText } from '@ionic/angular/standalone';
import { SettingsService, AppSettings } from 'app/services/settings.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-detail-description',
  templateUrl: './detail-description.component.html',
  styleUrls: ['./detail-description.component.scss'],
  standalone: true,
  imports: [IonText],
})
export class DetailDescriptionComponent implements OnInit, OnChanges {
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

  ngOnChanges(changes: SimpleChanges) {
    if (changes['species']) {
    }
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
}
