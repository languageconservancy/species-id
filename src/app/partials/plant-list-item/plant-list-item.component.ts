import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { IonIcon, IonItem, IonLabel, NavController } from '@ionic/angular/standalone';
import { Species } from 'app/models/species.model';
import { SpeciesService } from 'app/services/species.service';
import { SearchBarService } from 'app/services/search-bar.service';
import { chevronForward } from 'ionicons/icons';
import { addIcons } from 'ionicons';
import { SettingsService, AppSettings } from 'app/services/settings.service';
import { Subscription } from 'rxjs';
import { ASSET_PATHS } from 'app/constants/app-consts';
import { ShrinkToFitTextDirective } from 'app/directives/shrink-to-fit-text.directive';

@Component({
  selector: 'app-plant-list-item',
  templateUrl: './plant-list-item.component.html',
  standalone: true,
  imports: [IonIcon, IonItem, IonLabel, ShrinkToFitTextDirective],
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        max-width: 100%;
        min-width: 0;
      }

      ion-item.species-list-item {
        width: 100%;
        max-width: 100%;
        --padding-top: 0;
        --padding-bottom: 0;
        --inner-padding-end: 16px;
      }

      ion-item.species-list-item ion-icon[slot='end'] {
        margin-top: 0;
        margin-bottom: 0;
        align-self: center;
      }

      .species-list-item__content {
        display: flex;
        flex: 1;
        align-items: center;
        gap: 1rem;
        min-width: 0;
        padding: 8px 0;
      }

      .species-list-item__thumb {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 4.5rem;
        height: 4.5rem;
        border-radius: 0.375rem;
        overflow: hidden;
      }

      .species-list-item__thumb img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
      }

      ion-label.species-list-item__text {
        flex: 1;
        min-width: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      .species-list-item__text h2,
      .species-list-item__text p {
        margin: 0;
      }
    `,
  ],
})
export class PlantListItemComponent implements OnInit, OnChanges {
  @Input() item!: Species;
  @Input() isLastItem!: boolean;
  @Input() sortType!: string;
  protected subscribers: Subscription = new Subscription();
  settings: AppSettings = {
    useEnglish: true,
    showScientificNames: true,
    textScale: 1,
  };
  orderedNames: string[] = [];

  constructor(
    public speciesService: SpeciesService,
    public navController: NavController,
    public settingsService: SettingsService,
    private searchBarService: SearchBarService
  ) {
    addIcons({ chevronForward });
  }

  ngOnInit() {
    this._subscribeToSettings();
    if (this.item && this.sortType) {
      this._updateOrderedText();
    }
  }

  get listImageUrl(): string {
    const fileName = this.item?.images?.[0]?.fileName;
    if (!fileName) {
      return '';
    }
    return this.speciesService.buildImageUrl(fileName, this.item.type);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['item'] && changes['item'].currentValue) {
      this._updateOrderedText();
    }
    if (changes['sortType'] && changes['sortType'].currentValue) {
      this.sortType = changes['sortType'].currentValue;
      this._updateOrderedText();
    }
  }

  /** Local-name line: merged Crow names when present, else single `nameLocal`. */
  protected _displayLocalName(): string {
    return this.item.mergedLocalNamesDisplay ?? this.item.nameLocal;
  }

  protected _updateOrderedText() {
    if (!this.item) {
      return;
    }
    const local = this._displayLocalName();
    this.orderedNames = [];
    if (this.sortType === 'alphabetical-local') {
      this.orderedNames.push(local);
      if (this.settings.useEnglish) {
        this.orderedNames.push(this.item.nameEn);
      }
      if (this.settings.showScientificNames) {
        this.orderedNames.push(`(${this.item.nameScientific})`);
      }
    } else if (this.sortType === 'alphabetical-english') {
      this.orderedNames.push(this.item.nameEn);
      this.orderedNames.push(local);
      if (this.settings.showScientificNames) {
        this.orderedNames.push(`(${this.item.nameScientific})`);
      }
    } else if (this.sortType === 'alphabetical-latin') {
      this.orderedNames.push(`(${this.item.nameScientific})`);
      this.orderedNames.push(local);
      if (this.settings.useEnglish) {
        this.orderedNames.push(this.item.nameEn);
      }
    } else {
      this.orderedNames.push(local);
      if (this.settings.useEnglish) {
        this.orderedNames.push(this.item.nameEn);
      }
      if (this.settings.showScientificNames) {
        this.orderedNames.push(`(${this.item.nameScientific})`);
      }
    }
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
      this._updateOrderedText();
    });
    this.subscribers.add(sub);
  }

  onItemClick(item: Species) {
    if (this.searchBarService.shouldIgnoreTap()) {
      return;
    }
    this.navController.navigateForward(['/tabs/plants', item.id], {
      animationDirection: 'forward',
      animated: true,
    });
  }
}
