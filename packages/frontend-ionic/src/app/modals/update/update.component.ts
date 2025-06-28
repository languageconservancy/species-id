import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonToolbar,
  IonButtons,
  IonIcon,
  IonButton,
  IonProgressBar,
  IonFooter,
  ModalController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { close, download, checkmarkCircle, informationCircle } from 'ionicons/icons';
import { CloudStorageSyncService, UpdateProgress } from 'app/services/cloud-storage-sync.service';

@Component({
  selector: 'app-update',
  templateUrl: './update.component.html',
  styleUrls: ['./update.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonToolbar,
    IonButtons,
    IonIcon,
    IonButton,
    IonProgressBar,
    IonFooter,
  ],
})
export class UpdateComponent implements OnInit {
  updateProgress: UpdateProgress | null = null;
  isUpdating = false;
  updateComplete = false;
  updateError: string | null = null;

  constructor(
    private modalController: ModalController,
    private cloudStorageSyncService: CloudStorageSyncService
  ) {
    addIcons({ close, download, checkmarkCircle, informationCircle });
  }

  ngOnInit() {
    // Component is ready
  }

  async startUpdate() {
    this.isUpdating = true;
    this.updateError = null;
    this.updateComplete = false;

    try {
      // Subscribe to progress updates
      this.cloudStorageSyncService.progress$.subscribe((progress) => {
        this.updateProgress = progress;
        if (progress?.isComplete) {
          this.updateComplete = true;
          this.isUpdating = false;
        }
      });

      // Start the update process
      await this.cloudStorageSyncService.runUpdateWithProgress();
    } catch (error) {
      console.error('Update failed:', error);
      this.updateError = error instanceof Error ? error.message : 'Update failed';
      this.isUpdating = false;
    }
  }

  async skipUpdate() {
    // Mark that user has seen the update prompt
    await this.cloudStorageSyncService.markUpdatePromptSeen();
    return this.modalController.dismiss({ action: 'skip' });
  }

  close() {
    return this.modalController.dismiss({ action: 'close' });
  }

  get progressPercentage(): number {
    if (!this.updateProgress) return 0;
    return (this.updateProgress.current / this.updateProgress.total) * 100;
  }
}
