import { Component, OnInit, OnDestroy } from '@angular/core';
import { SettingsService, AppSettings } from 'app/services/settings.service';
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
import { CloudStorageSyncService } from 'app/services/cloud-storage-sync.service';
import { UpdateComponent } from 'app/modals/update/update.component';

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
  ],
})
export class SettingsPage implements OnInit, OnDestroy {
  settings: AppSettings = {
    useEnglish: true,
    showScientificNames: true,
  };
  originalSettings: AppSettings = {
    useEnglish: true,
    showScientificNames: true,
  };
  private settingsSubscription?: Subscription;

  constructor(
    private settingsService: SettingsService,
    private modalController: ModalController,
    private cloudStorageSyncService: CloudStorageSyncService
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

  async checkForUpdates() {
    try {
      const updatesAvailable = await this.cloudStorageSyncService.checkForUpdates();

      if (updatesAvailable) {
        // Show update popup
        const modal = await this.modalController.create({
          component: UpdateComponent,
          componentProps: {},
          presentingElement: await this.modalController.getTop(),
          breakpoints: [0, 1],
          initialBreakpoint: 1,
          backdropDismiss: false,
        });

        await modal.present();

        const { data } = await modal.onWillDismiss();
        console.log('Update modal dismissed with action:', data?.action);
      } else {
        // Show "no updates available" message
        // You could add a toast or alert here
        console.log('No updates available');
      }
    } catch (error) {
      console.error('Error checking for updates:', error);
    }
  }

  close() {
    // close modal
    this.modalController.dismiss();
  }
}
