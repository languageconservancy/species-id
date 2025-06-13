import { Component, OnInit, OnDestroy } from '@angular/core';
import { SettingsService, AppSettings } from 'app/services/settings.service';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { addIcons } from 'ionicons';
import { checkmarkCircle, close } from 'ionicons/icons';
import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonList,
  IonItem,
  IonLabel,
  IonToggle,
  IonFooter,
  IonButtons,
  IonButton,
  IonIcon,
  NavController,
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';

type BooleanSettings = Pick<AppSettings, 'useEnglish' | 'showScientificNames'>;

@Component({
  selector: 'app-settings-page',
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonHeader,
    IonTitle,
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
  ],
})
export class SettingsPage implements OnInit, OnDestroy {
  settings: AppSettings = {
    useEnglish: true,
    showScientificNames: true,
  };
  private settingsSubscription?: Subscription;

  constructor(
    private settingsService: SettingsService,
    private navController: NavController
  ) {
    addIcons({ checkmarkCircle, close });
  }

  ngOnInit() {
    this.settingsSubscription = this.settingsService.getSettings().subscribe((settings) => {
      this.settings = settings;
    });
  }

  ngOnDestroy() {
    this.settingsSubscription?.unsubscribe();
  }

  async toggleSetting(key: keyof BooleanSettings) {
    this.settings[key] = !this.settings[key];
    await this.settingsService.updateSettings(this.settings);
  }

  close() {
    this.navController.back();
  }
}
