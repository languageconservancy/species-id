import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { IonIcon, IonImg, IonItem, NavController } from '@ionic/angular/standalone';
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
  selector: 'app-bird-list-item',
  templateUrl: './bird-list-item.component.html',
  standalone: true,
  imports: [IonIcon, IonImg, IonItem, ShrinkToFitTextDirective],
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        max-width: 100%;
        min-width: 0;
      }

      ion-item {
        width: 100%;
        max-width: 100%;
        --inner-padding-end: 16px;
      }
    `,
  ],
})
export class BirdListItemComponent implements OnInit, OnChanges {
  @Input() item!: Species;
  @Input() isLastItem!: boolean;
  protected subscribers: Subscription = new Subscription();
  settings: AppSettings = {
    useEnglish: true,
    showScientificNames: true,
    textScale: 1,
  };
  imageUrl: string = '';
  @Input() sortType!: string;
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

  get hyphenatedNameLocal(): string {
    if (!this.item?.nameLocal) return '';
    // Insert soft hyphens every 4-6 characters to enable better breaking
    return this.item.nameLocal.replace(/(.{4,6})/g, '$1\u00AD');
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['item'] && changes['item'].currentValue) {
      this._loadImageUrl();
      this._updateOrderedText();
    }
    if (changes['sortType'] && changes['sortType'].currentValue) {
      this.sortType = changes['sortType'].currentValue;
      this._updateOrderedText();
    }
  }

  ngOnDestroy() {
    this.subscribers.unsubscribe();
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

  protected _subscribeToSettings() {
    const sub = this.settingsService.getSettings().subscribe((settings: AppSettings) => {
      this.settings = settings;
      this._updateOrderedText();
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
    if (this.searchBarService.shouldIgnoreTap()) {
      return;
    }
    this.navController.navigateForward(['/tabs/birds', item.id], {
      animationDirection: 'forward',
      animated: true,
    });
  }

  uppercaseEachWord(text: string): string {
    return text
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
