import { Component, Input, OnInit } from '@angular/core';
import { IonIcon, IonImg, IonItem, NavController } from '@ionic/angular/standalone';
import { Species } from 'app/models/species.model';
import { SpeciesService } from 'app/services/species.service';
import { chevronForward } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { SettingsService, AppSettings } from 'app/services/settings.service';
import { Subscription } from 'rxjs';
import { ASSET_PATHS } from 'app/constants/app-consts';

@Component({
  selector: 'app-plant-list-item',
  templateUrl: './plant-list-item.component.html',
  standalone: true,
  imports: [IonIcon, IonItem, IonImg],
})
export class PlantListItemComponent implements OnInit {
  @Input() item!: Species;
  @Input() isLastItem!: boolean;
  protected subscribers: Subscription = new Subscription();
  settings: AppSettings = {
    useEnglish: true,
    showScientificNames: true,
  };
  imageUrl: string = '';

  constructor(
    public speciesService: SpeciesService,
    public navController: NavController,
    public settingsService: SettingsService
  ) {
    addIcons({ chevronForward });
  }

  ngOnInit() {
    this._subscribeToSettings();
    this._loadImageUrl();
  }

  get hyphenatedNameLocal(): string {
    if (!this.item?.nameLocal) return '';
    // Insert soft hyphens every 4-6 characters to enable better breaking
    return this.item.nameLocal.replace(/(.{4,6})/g, '$1\u00AD');
  }

  ngOnDestroy() {
    this.subscribers.unsubscribe();
  }

  protected _subscribeToSettings() {
    const sub = this.settingsService.getSettings().subscribe((settings: AppSettings) => {
      this.settings = settings;
    });
    this.subscribers.add(sub);
  }

  private async _loadImageUrl() {
    if (this.item?.images && this.item.images.length > 0) {
      try {
        this.imageUrl = await this.speciesService.getImageUrl(
          this.item.images[0].fileName,
          this.item.type
        );
      } catch (error) {
        console.error(ASSET_PATHS.ERROR_EMOJI, 'Error loading image URL:', error);
        this.imageUrl = '';
      }
    }
  }

  onItemClick(item: Species) {
    this.navController.navigateForward(['/tabs/plants', item.id], {
      animationDirection: 'forward',
      animated: true,
    });
  }
}
