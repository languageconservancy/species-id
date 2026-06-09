import { Component, OnInit, OnDestroy } from '@angular/core';
import { SettingsService, AppSettings, TEXT_SCALE_TICK_LABELS } from 'app/services/settings.service';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { addIcons } from 'ionicons';
import { checkmarkCircle, close, moon, sunny, refresh } from 'ionicons/icons';
import {
  IonContent,
  IonToolbar,
  IonList,
  IonItem,
  IonLabel,
  IonToggle,
  IonFooter,
  IonButtons,
  IonButton,
  IonIcon,
  ModalController,
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from 'app/partials/header/header.component';
import { IonRange } from '@ionic/angular/standalone';

type BooleanSettings = Pick<AppSettings, 'useEnglish' | 'showScientificNames'>;

@Component({
  selector: 'app-settings-page',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonToolbar,
    IonList,
    IonItem,
    IonLabel,
    IonToggle,
    FormsModule,
    IonFooter,
    IonButtons,
    IonButton,
    IonIcon,
    HeaderComponent,
    IonRange,
  ],
})
export class SettingsPage implements OnInit, OnDestroy {
  readonly textScaleTickLabels = TEXT_SCALE_TICK_LABELS;

  settings: AppSettings = {
    useEnglish: true,
    showScientificNames: true,
    textScale: 1,
  };
  originalSettings: AppSettings = {
    useEnglish: true,
    showScientificNames: true,
    textScale: 1,
  };
  private settingsSubscription?: Subscription;

  constructor(
    private settingsService: SettingsService,
    private modalController: ModalController
  ) {
    addIcons({ checkmarkCircle, close, moon, sunny, refresh });
  }

  ngOnInit() {
    this.settingsSubscription = this.settingsService.getSettings().subscribe((settings) => {
      this.settings = settings;
      this.originalSettings = { ...settings };
    });
  }

  ngOnDestroy() {
    this.settingsSubscription?.unsubscribe();
  }

  toggleSetting(key: keyof BooleanSettings) {
    this.settings[key] = !this.settings[key];
  }

  async applySettings() {
    await this.settingsService.updateSettings(this.settings);
    this.originalSettings = { ...this.settings };
    this.close();
  }

  async cancel() {
    this.settings = { ...this.originalSettings };
    await this.settingsService.updateSettings(this.settings);
    this.close();
  }

  onTextSizeChange(event: any) {
    this.settings.textScale = event.detail.value;
    this.settingsService.applyTextScale(this.settings.textScale);
  }

  close() {
    // close modal
    this.modalController.dismiss();
  }
}
