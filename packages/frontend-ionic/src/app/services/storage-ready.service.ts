/**
 * This service is used to check if the storage is ready,
 * and to create the storage if it is not already created.
 * This is used to avoid race conditions when the storage is used in the app,
 * and because storage.create() should be called only once.
 */

import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';

@Injectable({ providedIn: 'root' })
export class StorageReadyService {
  private isReady = false;

  constructor(private storage: Storage) {}

  async ready(): Promise<void> {
    if (!this.isReady) {
      try {
        await this.storage.create();
        this.isReady = true;
      } catch (error) {
        console.error('Error creating storage', error);
      }
    }
  }
}
