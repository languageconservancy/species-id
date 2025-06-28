import { Injectable } from '@angular/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { ConfigService } from 'app/services/config.service';
import { Storage } from '@ionic/storage-angular';
import { StorageReadyService } from 'app/services/storage-ready.service';
import { CapacitorHttp } from '@capacitor/core';
import { Network } from '@capacitor/network';
import { BehaviorSubject } from 'rxjs';

export interface UpdateProgress {
  current: number;
  total: number;
  currentFile: string;
  isComplete: boolean;
  error?: string;
}

@Injectable({
  providedIn: 'root',
})
/**
 * This service is used to sync all assets with the remote S3 index.
 * All files (index.json, database files, media files) are downloaded from S3.
 * This provides smooth, internal updates without requiring app store updates.
 */
export class CloudStorageSyncService {
  private readonly INITIAL_SYNC_COMPLETE_KEY = 'initial_sync_complete';
  private readonly UPDATE_PROMPT_SEEN_KEY = 'update_prompt_seen';
  private readonly indexUrl: string = '';
  private dbIsReady: boolean = false;
  private dbIsReadyPromise: Promise<void> | null = null;
  private dbIsReadyResolve: ((value: void | PromiseLike<void>) => void) | null = null;
  private cloudStorageIndexJson: any;

  // Progress tracking
  public progress$ = new BehaviorSubject<UpdateProgress | null>(null);

  /**
   * Creates an instance of CloudStorageSyncService.
   * Initializes the service with configuration and sets up network status monitoring.
   * @param configService - Service for accessing application configuration
   * @param storage - Ionic storage service for persistent data
   * @param storageReady - Service to ensure storage is ready before use
   */
  constructor(
    private configService: ConfigService,
    private storage: Storage,
    private storageReady: StorageReadyService
  ) {
    this.dbIsReadyPromise = new Promise((resolveFunction) => {
      this.dbIsReadyResolve = resolveFunction;
    });

    this.indexUrl = this.joinUrl(
      this.configService.get<string>('assetBaseUrl') ?? '',
      'index.json'
    );
    console.log('indexUrl', this.indexUrl);

    Network.addListener('networkStatusChange', (status) => {
      console.log('Network status changed:', status);
      // Handle network changes (e.g., retry failed operations)
    });
  }

  /**
   * Checks if the initial sync with the S3 storage is complete,
   * meaning media files have been downloaded and saved in persistent storage.
   * @returns {Promise<boolean>} - True if the initial sync is complete, false otherwise.
   */
  async isInitialSyncComplete(): Promise<boolean> {
    await this.storageReady.ready();
    const isInitialSyncComplete = await this.storage.get(this.INITIAL_SYNC_COMPLETE_KEY);
    return isInitialSyncComplete ?? false;
  }

  /**
   * Checks if the user has seen the update prompt recently.
   * This prevents showing the update prompt too frequently to users.
   * @returns {Promise<boolean>} - True if the prompt was seen recently (within 24 hours), false otherwise.
   */
  async hasSeenUpdatePrompt(): Promise<boolean> {
    await this.storageReady.ready();
    const lastSeen = await this.storage.get(this.UPDATE_PROMPT_SEEN_KEY);
    if (!lastSeen) return false;

    // Check if it's been more than 24 hours since last seen
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    return lastSeen > oneDayAgo;
  }

  /**
   * Marks that the user has seen the update prompt.
   * This is used to track when the user last saw the update prompt to avoid showing it too frequently.
   */
  async markUpdatePromptSeen(): Promise<void> {
    await this.storageReady.ready();
    await this.storage.set(this.UPDATE_PROMPT_SEEN_KEY, Date.now());
  }

  /**
   * Waits until the database is ready for use.
   * This method blocks until the initial sync is complete and the database files are available.
   * @returns {Promise<void>} - A promise that resolves when the database is ready.
   */
  async waitUntilDbIsReady(): Promise<void> {
    await this.storageReady.ready();
    if (this.dbIsReady) {
      return;
    }
    await this.dbIsReadyPromise;
  }

  /**
   * Sets the database as ready and resolves the waiting promise.
   * This is called when the initial sync is complete and database files are available.
   */
  private setDbIsReady(): void {
    console.log('[setDbIsReady]');
    this.dbIsReady = true;
    if (this.dbIsReadyResolve) {
      this.dbIsReadyResolve();
    }
  }

  /**
   * Checks if the device has an active internet connection.
   * Uses Capacitor Network plugin for reliable detection across platforms.
   * Falls back to navigator.onLine if the Network plugin fails.
   * @returns {Promise<boolean>} - True if connected, false otherwise.
   */
  private async isOnline(): Promise<boolean> {
    try {
      const status = await Network.getStatus();
      return status.connected;
    } catch (error) {
      console.warn(
        '[isOnline] Could not get network status, falling back to navigator.onLine:',
        error
      );
      // Fallback to navigator.onLine if Network plugin fails
      return navigator.onLine;
    }
  }

  /**
   * Runs the initial sync with the S3 storage.
   * This will download the index.json, database files, and all other files from S3.
   * All updates are handled internally without requiring app store updates.
   * Internet connection is required.
   */
  async runInitialSync(): Promise<void> {
    console.log('[runInitialSync]');
    if (!(await this.isOnline())) {
      throw new Error(
        'No internet connection. Initial sync requires online access. Reopen the app when you have internet access.'
      );
    }

    // Download and save the remote index.json
    console.log('[runInitialSync] Downloading index.json from S3');
    const remoteIndex: string = await this.downloadIndexJsonFromCloudStorage();
    await this.ensureDirectoryExists('');
    await this.writeFile('index.json', remoteIndex, Encoding.UTF8);

    // Download database files
    await this.syncDatabaseFiles();

    // Download all other files recursively (excluding databases)
    await this.syncAllFiles();

    // Mark initial sync as complete
    await this.storage.set(this.INITIAL_SYNC_COMPLETE_KEY, true);

    const contents = await this.getContentsOfLibraryNoCloud();
    console.log('[runInitialSync] Contents of Library/NoCloud:', contents);

    this.setDbIsReady();
  }

  /**
   * Runs an update with progress tracking.
   * This method downloads only the files that need updating.
   */
  async runUpdateWithProgress(): Promise<void> {
    console.log('[runUpdateWithProgress]');
    if (!(await this.isOnline())) {
      throw new Error('No internet connection. Update requires online access.');
    }

    // Download and save the remote index.json
    console.log('[runUpdateWithProgress] Downloading index.json from S3');
    const remoteIndex: string = await this.downloadIndexJsonFromCloudStorage();
    await this.ensureDirectoryExists('');
    await this.writeFile('index.json', remoteIndex, Encoding.UTF8);

    // Count total files that need updating
    const totalFiles = await this.countFilesNeedingUpdate();
    let updatedCount = 0;

    console.log(`[runUpdateWithProgress] Found ${totalFiles} files that need updating`);

    // Update database files with progress
    await this.syncDatabaseFilesWithProgress(totalFiles, updatedCount);

    // Update all other files with progress
    await this.syncAllFilesWithProgress(totalFiles, updatedCount);

    // Mark update as complete
    this.progress$.next({
      current: totalFiles,
      total: totalFiles,
      currentFile: 'Update complete',
      isComplete: true,
    });

    console.log('[runUpdateWithProgress] Update completed successfully');
  }

  /**
   * Counts the total number of files that need updating by comparing local files with remote hashes.
   * This includes both database files and media files that are out of sync.
   * @returns {Promise<number>} - The total number of files that need to be updated.
   */
  private async countFilesNeedingUpdate(): Promise<number> {
    if (!this.cloudStorageIndexJson) {
      return 0;
    }

    let count = 0;

    // Count database files that need updating
    if (this.cloudStorageIndexJson.databases) {
      for (const { path, hash } of this.cloudStorageIndexJson.databases) {
        const exists = await this.checkAndCompareHash(path, hash);
        if (!exists) {
          count++;
        }
      }
    }

    // Count media files that need updating
    count += this.countFilesRecursive(this.cloudStorageIndexJson, 'databases');

    return count;
  }

  /**
   * Syncs database files with progress tracking.
   * Downloads database files that don't exist locally or have different hashes,
   * and updates the progress observable with current status.
   * @param totalFiles - The total number of files being updated in this sync operation
   * @param updatedCount - The current count of files that have been updated
   * @returns {Promise<number>} - The updated count after processing database files
   */
  private async syncDatabaseFilesWithProgress(
    totalFiles: number,
    updatedCount: number
  ): Promise<number> {
    console.log('[syncDatabaseFilesWithProgress] Starting database sync');

    if (!this.cloudStorageIndexJson || !this.cloudStorageIndexJson.databases) {
      console.log('[syncDatabaseFilesWithProgress] No database files to sync');
      return updatedCount;
    }

    for (const { path, hash } of this.cloudStorageIndexJson.databases) {
      const exists = await this.checkAndCompareHash(path, hash);

      if (!exists) {
        updatedCount++;
        const filename = path.split('/').pop() || path;

        this.progress$.next({
          current: updatedCount,
          total: totalFiles,
          currentFile: `Database: ${filename}`,
          isComplete: false,
        });

        console.log(`[syncDatabaseFilesWithProgress] Downloading database file: ${path}`);

        const fileExtension = this.getFileExtension(path).toLowerCase();
        if (fileExtension === 'json') {
          await this.downloadJsonFile(path);
        } else {
          await this.downloadDatabaseFile(path);
        }
      }
    }

    return updatedCount;
  }

  /**
   * Syncs all files (excluding databases) with progress tracking.
   * Recursively processes all directories and files in the cloud storage index,
   * downloading files that need updating and tracking progress.
   * @param totalFiles - The total number of files being updated in this sync operation
   * @param updatedCount - The current count of files that have been updated
   * @returns {Promise<number>} - The updated count after processing all files
   */
  private async syncAllFilesWithProgress(
    totalFiles: number,
    updatedCount: number
  ): Promise<number> {
    console.log('[syncAllFilesWithProgress]');

    if (!this.cloudStorageIndexJson) {
      console.log('[syncAllFilesWithProgress] No index data available');
      return updatedCount;
    }

    // Recursively process all directories except 'databases'
    return await this.syncDirectoryRecursiveWithProgress(
      this.cloudStorageIndexJson,
      '',
      totalFiles,
      updatedCount
    );
  }

  /**
   * Recursively syncs files from a directory structure with progress tracking.
   * Walks through the cloud storage index object and processes files and subdirectories,
   * excluding the 'databases' directory which is handled separately.
   * @param obj - The directory object to process (from cloud storage index)
   * @param currentPath - The current path being processed
   * @param totalFiles - The total number of files being updated in this sync operation
   * @param updatedCount - The current count of files that have been updated
   * @returns {Promise<number>} - The updated count after processing this directory
   */
  private async syncDirectoryRecursiveWithProgress(
    obj: any,
    currentPath: string,
    totalFiles: number,
    updatedCount: number
  ): Promise<number> {
    for (const [key, value] of Object.entries(obj)) {
      // Skip the databases directory
      if (key === 'databases') {
        console.log(
          `[syncDirectoryRecursiveWithProgress] Skipping databases directory: ${currentPath}/${key}`
        );
        continue;
      }

      if (Array.isArray(value)) {
        // This is an array of files to sync
        console.log(
          `[syncDirectoryRecursiveWithProgress] Syncing ${value.length} files in: ${currentPath}/${key}`
        );
        updatedCount = await this.syncFileArrayWithProgress(
          value,
          `${currentPath}/${key}`,
          totalFiles,
          updatedCount
        );
      } else if (typeof value === 'object' && value !== null) {
        // This is a subdirectory, recurse into it
        console.log(
          `[syncDirectoryRecursiveWithProgress] Entering subdirectory: ${currentPath}/${key}`
        );
        updatedCount = await this.syncDirectoryRecursiveWithProgress(
          value,
          `${currentPath}/${key}`,
          totalFiles,
          updatedCount
        );
      }
    }

    return updatedCount;
  }

  /**
   * Syncs an array of files from a specific directory with progress tracking.
   * Downloads files that don't exist locally or have different hashes,
   * and updates the progress observable with current status.
   * @param files - Array of file objects with path and hash properties
   * @param directoryPath - The directory path being processed
   * @param totalFiles - The total number of files being updated in this sync operation
   * @param updatedCount - The current count of files that have been updated
   * @returns {Promise<number>} - The updated count after processing these files
   */
  private async syncFileArrayWithProgress(
    files: any[],
    directoryPath: string,
    totalFiles: number,
    updatedCount: number
  ): Promise<number> {
    for (const { path, hash } of files) {
      const exists = await this.checkAndCompareHash(path, hash);
      if (!exists) {
        updatedCount++;
        const filename = path.split('/').pop() || path;

        this.progress$.next({
          current: updatedCount,
          total: totalFiles,
          currentFile: filename,
          isComplete: false,
        });

        console.log(`[syncFileArrayWithProgress] Downloading file: ${path}`);

        const fileExtension = this.getFileExtension(path).toLowerCase();
        if (fileExtension === 'json') {
          await this.downloadJsonFile(path);
        } else {
          await this.downloadBinaryFile(path);
        }
      }
    }

    return updatedCount;
  }

  /**
   * Gets the contents of the Library/NoCloud/databases directory.
   * This is used for debugging and verification purposes.
   * @returns {Promise<string[]>} - Array of filenames in the databases directory
   */
  private async getContentsOfLibraryNoCloud(): Promise<string[]> {
    const contents = await Filesystem.readdir({
      path: 'databases',
      directory: Directory.LibraryNoCloud,
    });
    return contents.files.map((file) => file.name);
  }

  /**
   * Downloads the index.json file from the S3 cloud storage.
   * This file contains metadata about all available files including their paths and hashes.
   * The downloaded index is parsed and stored for use in sync operations.
   * @returns {Promise<string>} - The raw JSON string content of the index file
   * @throws {Error} - If the download fails or the response is invalid
   */
  private async downloadIndexJsonFromCloudStorage(): Promise<string> {
    console.log('[downloadIndexJsonFromCloudStorage]');
    try {
      const response = await CapacitorHttp.get({
        url: this.indexUrl,
      });
      if (!response.data) {
        throw new Error(`Failed to download remote index. URL: ${this.indexUrl}`);
      }
      const remoteIndex = await response.data;
      if (typeof remoteIndex === 'string') {
        this.cloudStorageIndexJson = JSON.parse(remoteIndex);
        return remoteIndex;
      } else {
        this.cloudStorageIndexJson = remoteIndex;
        return JSON.stringify(remoteIndex);
      }
    } catch (error) {
      console.error('⚠️ Error downloading remote index', error);
      throw error;
    }
  }

  /**
   * Syncs database files from S3 cloud storage.
   * Downloads database files that don't exist locally or have different hashes.
   * Database files are stored in the Library/NoCloud/databases/ directory.
   * Supports both JSON and binary database file formats.
   */
  async syncDatabaseFiles(): Promise<void> {
    console.log('[syncDatabaseFiles] Starting database sync');

    if (!this.cloudStorageIndexJson || !this.cloudStorageIndexJson.databases) {
      console.log('[syncDatabaseFiles] No database files to sync');
      return;
    }

    console.log(
      `[syncDatabaseFiles] Found ${this.cloudStorageIndexJson.databases.length} database files to check`
    );

    for (const { path, hash } of this.cloudStorageIndexJson.databases) {
      console.log(`[syncDatabaseFiles] Checking database file: ${path} with hash: ${hash}`);

      const exists = await this.checkAndCompareHash(path, hash);
      console.log(`[syncDatabaseFiles] File ${path} exists with correct hash: ${exists}`);

      if (!exists) {
        console.log(`[syncDatabaseFiles] Downloading database file: ${path}`);

        // Determine file type and use appropriate download method
        const fileExtension = this.getFileExtension(path).toLowerCase();
        if (fileExtension === 'json') {
          console.log(`[syncDatabaseFiles] Downloading as JSON file: ${path}`);
          await this.downloadJsonFile(path);
        } else {
          console.log(`[syncDatabaseFiles] Downloading as database file: ${path}`);
          await this.downloadDatabaseFile(path);
        }
      } else {
        console.debug(`[syncDatabaseFiles] Database file already exists: ${path}`);
      }
    }

    console.log('[syncDatabaseFiles] Database sync completed');
  }

  /**
   * Syncs all files from S3 cloud storage recursively, excluding the databases directory.
   * This method dynamically handles any directory structure defined in the index.json file.
   * Media files, configuration files, and other assets are downloaded to their respective directories.
   */
  async syncAllFiles(): Promise<void> {
    console.log('[syncAllFiles]');

    if (!this.cloudStorageIndexJson) {
      console.log('[syncAllFiles] No index data available');
      return;
    }

    // Recursively process all directories except 'databases'
    await this.syncDirectoryRecursive(this.cloudStorageIndexJson, '');
  }

  /**
   * Recursively syncs files from a directory structure defined in the cloud storage index.
   * Walks through the index object and processes files and subdirectories,
   * excluding the 'databases' directory which is handled separately.
   * @param obj - The directory object to process (from cloud storage index)
   * @param currentPath - The current path being processed
   */
  private async syncDirectoryRecursive(obj: any, currentPath: string): Promise<void> {
    for (const [key, value] of Object.entries(obj)) {
      // Skip the databases directory
      if (key === 'databases') {
        console.log(`[syncDirectoryRecursive] Skipping databases directory: ${currentPath}/${key}`);
        continue;
      }

      if (Array.isArray(value)) {
        // This is an array of files to sync
        console.log(
          `[syncDirectoryRecursive] Syncing ${value.length} files in: ${currentPath}/${key}`
        );
        await this.syncFileArray(value, `${currentPath}/${key}`);
      } else if (typeof value === 'object' && value !== null) {
        // This is a subdirectory, recurse into it
        console.log(`[syncDirectoryRecursive] Entering subdirectory: ${currentPath}/${key}`);
        await this.syncDirectoryRecursive(value, `${currentPath}/${key}`);
      }
    }
  }

  /**
   * Syncs an array of files from a specific directory.
   * Downloads files that don't exist locally or have different hashes.
   * Automatically determines the appropriate download method based on file extension.
   * @param files - Array of file objects with path and hash properties
   * @param directoryPath - The directory path being processed
   */
  private async syncFileArray(files: any[], directoryPath: string): Promise<void> {
    for (const { path, hash } of files) {
      const exists = await this.checkAndCompareHash(path, hash);
      if (!exists) {
        console.log(`[syncFileArray] Downloading file: ${path}`);

        // Determine file type and use appropriate download method
        const fileExtension = this.getFileExtension(path).toLowerCase();
        if (fileExtension === 'json') {
          await this.downloadJsonFile(path);
        } else {
          await this.downloadBinaryFile(path);
        }
      } else {
        console.debug(`[syncFileArray] File already exists: ${path}`);
      }
    }
  }

  /**
   * Downloads all files for offline mode, excluding databases.
   * This ensures the app works completely offline.
   */
  async downloadAllFilesForOffline(): Promise<void> {
    console.log('[downloadAllFilesForOffline]');
    if (!(await this.isOnline())) {
      throw new Error('Internet connection required to download files for offline mode');
    }

    if (!this.cloudStorageIndexJson) {
      console.log('[downloadAllFilesForOffline] No index data available');
      return;
    }

    // Count total files first
    const totalFiles = this.countFilesRecursive(this.cloudStorageIndexJson, 'databases');
    let downloadedCount = 0;

    console.log(`[downloadAllFilesForOffline] Found ${totalFiles} files to download`);

    // Download all files recursively
    await this.downloadDirectoryRecursive(
      this.cloudStorageIndexJson,
      '',
      totalFiles,
      downloadedCount
    );
  }

  /**
   * Counts files recursively in a directory structure, excluding specified directories.
   * Walks through the cloud storage index object and counts all files in arrays,
   * recursively processing subdirectories while skipping the excluded directory.
   * @param obj - The directory object to process (from cloud storage index)
   * @param excludeDir - The directory name to exclude from counting
   * @returns {number} - The total number of files found
   */
  private countFilesRecursive(obj: any, excludeDir: string): number {
    let count = 0;

    for (const [key, value] of Object.entries(obj)) {
      if (key === excludeDir) {
        continue;
      }

      if (Array.isArray(value)) {
        count += value.length;
      } else if (typeof value === 'object' && value !== null) {
        count += this.countFilesRecursive(value, excludeDir);
      }
    }

    return count;
  }

  /**
   * Recursively downloads files from a directory structure for offline mode.
   * Walks through the cloud storage index and downloads all files that don't exist locally,
   * excluding the 'databases' directory which is handled separately.
   * @param obj - The directory object to process (from cloud storage index)
   * @param currentPath - The current path being processed
   * @param totalFiles - The total number of files to download
   * @param downloadedCount - The current count of files that have been downloaded
   * @returns {Promise<number>} - The updated count after processing this directory
   */
  private async downloadDirectoryRecursive(
    obj: any,
    currentPath: string,
    totalFiles: number,
    downloadedCount: number
  ): Promise<number> {
    for (const [key, value] of Object.entries(obj)) {
      // Skip the databases directory
      if (key === 'databases') {
        continue;
      }

      if (Array.isArray(value)) {
        // This is an array of files to download
        for (const { path, hash } of value) {
          const exists = await this.checkAndCompareHash(path, hash);
          if (!exists) {
            downloadedCount++;
            console.log(
              `[downloadDirectoryRecursive] Downloading ${downloadedCount}/${totalFiles}: ${path}`
            );

            const fileExtension = this.getFileExtension(path).toLowerCase();
            if (fileExtension === 'json') {
              await this.downloadJsonFile(path);
            } else {
              await this.downloadBinaryFile(path);
            }
          } else {
            console.debug(`[downloadDirectoryRecursive] Already exists: ${path}`);
          }
        }
      } else if (typeof value === 'object' && value !== null) {
        // This is a subdirectory, recurse into it
        downloadedCount = await this.downloadDirectoryRecursive(
          value,
          `${currentPath}/${key}`,
          totalFiles,
          downloadedCount
        );
      }
    }

    return downloadedCount;
  }

  /**
   * Checks for updates by comparing local files with remote hashes.
   * Downloads the latest index.json from S3 and compares local file hashes with remote hashes
   * to determine if updates are available. This method is much simpler than the hybrid approach.
   * @returns {Promise<boolean>} - True if updates are available, false if all files are up to date
   */
  async checkForUpdates(): Promise<boolean> {
    console.log('[checkForUpdates]');
    this.setDbIsReady();
    const contents = await this.getContentsOfLibraryNoCloud();
    console.log('[checkForUpdates] Contents of Library/NoCloud:', contents);

    if (!(await this.isOnline())) {
      console.warn('[checkForUpdates] No internet connection, skipping update check');
      return false;
    }

    // Re-fetch the remote index to get latest hashes
    try {
      const remoteIndex: string = await this.downloadIndexJsonFromCloudStorage();
      const latestIndex = JSON.parse(remoteIndex);

      let updatesAvailable = false;

      // Check database files
      if (latestIndex.databases) {
        for (const { path, hash } of latestIndex.databases) {
          const exists = await this.checkAndCompareHash(path, hash);
          if (!exists) {
            console.log(`[checkForUpdates] Database update available: ${path}`);
            updatesAvailable = true;
          }
        }
      }

      // Check media files
      if (latestIndex.birds && latestIndex.birds.images) {
        for (const { path, hash } of latestIndex.birds.images) {
          const exists = await this.checkAndCompareHash(path, hash);
          if (!exists) {
            console.log(`[checkForUpdates] Media update available: ${path}`);
            updatesAvailable = true;
          }
        }
      }

      if (updatesAvailable) {
        console.log('[checkForUpdates] ⚠️ Updates available - run sync to download');
        return true;
      } else {
        console.log('[checkForUpdates] ✅ All files are up to date');
        return false;
      }
    } catch (error) {
      console.warn('[checkForUpdates] Could not check for updates:', error);
      return false;
    }
  }

  /**
   * Downloads and saves a JSON file from S3 cloud storage.
   * Downloads the file content and saves it to the local filesystem with UTF-8 encoding.
   * Automatically creates the necessary directory structure if it doesn't exist.
   * @param remotePath - The path of the JSON file in the cloud storage
   * @throws {Error} - If the download fails or the response is invalid
   */
  private async downloadJsonFile(remotePath: string): Promise<void> {
    const remoteUrl = this.joinUrl(
      this.configService.get<string>('assetBaseUrl') ?? '',
      remotePath
    );

    try {
      const response = await CapacitorHttp.get({
        url: remoteUrl,
      });

      if (!response.data) {
        throw new Error(`Failed to download JSON file: ${remoteUrl}`);
      }

      // JSON files are already strings, no conversion needed
      const jsonData =
        typeof response.data === 'string' ? response.data : JSON.stringify(response.data);

      // Ensure directory exists
      const pathParts = remotePath.split('/');
      const directory = pathParts.slice(0, -1).join('/');
      if (directory) {
        await this.ensureDirectoryExists(directory);
      }

      // Write file with UTF-8 encoding
      await this.writeFile(remotePath, jsonData, Encoding.UTF8);
      console.log(`✅ Downloaded and saved JSON file: ${remotePath}`);
    } catch (error) {
      console.error(`⚠️ Error downloading JSON file ${remotePath}:`, error);
      throw error;
    }
  }

  /**
   * Downloads and saves a binary file (images, audio, etc.) from S3 cloud storage.
   * Downloads the file as a blob and converts it to base64 format for storage.
   * Automatically creates the necessary directory structure if it doesn't exist.
   * @param remotePath - The path of the binary file in the cloud storage
   * @throws {Error} - If the download fails or the response is invalid
   */
  private async downloadBinaryFile(remotePath: string): Promise<void> {
    const remoteUrl = this.joinUrl(
      this.configService.get<string>('assetBaseUrl') ?? '',
      remotePath
    );

    try {
      const response = await CapacitorHttp.get({
        url: remoteUrl,
        responseType: 'blob',
      });

      if (!response.data) {
        throw new Error(`Failed to download binary file: ${remoteUrl}`);
      }

      // Convert response data to base64 using robust conversion
      let base64Data: string;
      try {
        base64Data = await this.convertResponseDataToBase64(response.data);
      } catch (error) {
        console.error(`⚠️ Error converting response data to base64: ${remoteUrl}`, error);
        throw error;
      }

      // Ensure directory exists
      const pathParts = remotePath.split('/');
      const directory = pathParts.slice(0, -1).join('/');
      if (directory) {
        await this.ensureDirectoryExists(directory);
      }

      // Write file without encoding (binary mode)
      await this.writeFile(remotePath, base64Data);
      console.log(`✅ Downloaded and saved binary file: ${remotePath}`);
    } catch (error) {
      console.error(`⚠️ Error downloading binary file ${remotePath}:`, error);
      throw error;
    }
  }

  /**
   * Downloads and saves a database file from S3 to the LibraryNoCloud/databases/ directory.
   * Downloads the file as a blob, converts it to base64, and writes it to the local filesystem.
   * Verifies the file after writing and logs the result.
   * @param remotePath - The path of the database file in the cloud storage
   * @throws {Error} - If the download or file write fails
   */
  private async downloadDatabaseFile(remotePath: string): Promise<void> {
    const remoteUrl = this.joinUrl(
      this.configService.get<string>('assetBaseUrl') ?? '',
      remotePath
    );

    console.log(`[downloadDatabaseFile] Starting download from: ${remoteUrl}`);

    try {
      const response = await CapacitorHttp.get({
        url: remoteUrl,
        responseType: 'blob',
      });

      console.log(`[downloadDatabaseFile] Response received, status: ${response.status}`);

      if (!response.data) {
        throw new Error(`Failed to download database file: ${remoteUrl}`);
      }

      console.log(`[downloadDatabaseFile] Response data type: ${typeof response.data}`);

      // Convert response data to base64 using robust conversion
      let base64Data: string;
      try {
        base64Data = await this.convertResponseDataToBase64(response.data);
        console.log(`[downloadDatabaseFile] Converted to base64, length: ${base64Data.length}`);
      } catch (error) {
        console.error(`⚠️ Error converting response data to base64: ${remoteUrl}`, error);
        throw error;
      }

      // Extract just the filename from the path
      const pathParts = remotePath.split('/');
      const filename = pathParts[pathParts.length - 1];

      console.log(`[downloadDatabaseFile] Writing file: ${filename} to LibraryNoCloud/databases/`);

      // Ensure the databases directory exists in LibraryNoCloud
      await this.ensureDirectoryExists('databases');

      // Write database file to LibraryNoCloud/databases/ directory
      await Filesystem.writeFile({
        path: `databases/${filename}`,
        data: base64Data,
        directory: Directory.LibraryNoCloud,
      });

      console.log(
        `✅ Downloaded and saved database file: ${filename} to LibraryNoCloud/databases/`
      );

      // Verify the file was written
      try {
        const statResult = await Filesystem.stat({
          path: `databases/${filename}`,
          directory: Directory.LibraryNoCloud,
        });
        console.log(`[downloadDatabaseFile] File verification - size: ${statResult.size}`);
      } catch (verifyError) {
        console.error(`[downloadDatabaseFile] File verification failed:`, verifyError);
      }
    } catch (error) {
      console.error(`⚠️ Error downloading database file ${remotePath}:`, error);
      throw error;
    }
  }

  /**
   * Checks if a file exists locally and if its hash matches the expected hash.
   * Reads the file from the local filesystem, computes its SHA-256 hash, and compares it.
   * @param path - The path of the file to check
   * @param expectedHash - The expected SHA-256 hash of the file
   * @returns {Promise<boolean>} - True if the file exists and the hash matches, false otherwise
   */
  private async checkAndCompareHash(path: string, expectedHash: string): Promise<boolean> {
    console.log('[checkAndCompareHash]', path, expectedHash);

    // Determine if this is a database file
    const fileExtension = this.getFileExtension(path).toLowerCase();
    const isDatabaseFile = fileExtension === 'db';

    // Use LibraryNoCloud for all files (including databases)
    const directory = Directory.LibraryNoCloud;
    console.debug(`[checkAndCompareHash] directory: ${directory}`);

    // For database files, use the databases subfolder path
    const filePath = isDatabaseFile ? `databases/${path.split('/').pop()}` : path;
    console.debug(`[checkAndCompareHash] checking file path: ${filePath}`);

    try {
      const { data } = await Filesystem.readFile({ path: filePath, directory });
      console.debug(`[checkAndCompareHash] File exists, data type: ${typeof data}`);

      if (typeof data !== 'string') {
        console.debug(`[checkAndCompareHash] Data is not a string, type: ${typeof data}`);
        // If data is not a string, we cannot compute the hash
        return false;
      }

      console.debug(`[checkAndCompareHash] File exists, data length: ${data.length}`);
      console.debug(`[checkAndCompareHash] Base64 data starts with: ${data.substring(0, 50)}...`);

      const localHash = await this.sha256FromBase64(data);
      console.debug(
        `[checkAndCompareHash] ${path}, Local hash: ${localHash}, Expected hash: ${expectedHash}`
      );
      console.debug(`[checkAndCompareHash] Hash match: ${localHash === expectedHash}`);
      return localHash === expectedHash;
    } catch (error) {
      console.debug(`[checkAndCompareHash] File does not exist or error reading: ${error}`);
      return false; // File doesn't exist or error reading file
    }
  }

  /**
   * Computes the SHA-256 hash of a base64-encoded string.
   * Converts the base64 string to binary and computes the hash using the SubtleCrypto API.
   * @param base64 - The base64-encoded string to hash
   * @returns {Promise<string>} - The SHA-256 hash as a lowercase hex string
   */
  private async sha256FromBase64(base64: string): Promise<string> {
    // Convert base64 to binary data (same as Node.js readFile)
    const raw = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

    // Hash the raw binary data (same as Node.js createHash('sha256').update(data).digest('hex'))
    const hashBuffer = await crypto.subtle.digest('SHA-256', raw);

    // Convert to lowercase hex string (same as Node.js digest('hex'))
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Converts a Blob to a base64-encoded string.
   * Uses FileReader to read the Blob and extract the base64 data.
   * @param blob - The Blob to convert
   * @returns {Promise<string>} - The base64-encoded string (without the data URL prefix)
   */
  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Converts various response data types (string, Blob, ArrayBuffer, Uint8Array) to base64.
   * Handles different data types returned by HTTP requests and ensures base64 output.
   * @param data - The response data to convert
   * @returns {Promise<string>} - The base64-encoded string
   * @throws {Error} - If the data type is unsupported
   */
  private async convertResponseDataToBase64(data: any): Promise<string> {
    // If it's already a string (base64), return it
    if (typeof data === 'string') {
      return data;
    }

    // If it's a Blob, use the existing blobToBase64 method
    if (typeof Blob !== 'undefined' && data instanceof Blob) {
      return await this.blobToBase64(data);
    }

    // If it's an ArrayBuffer, convert to base64
    if (typeof ArrayBuffer !== 'undefined' && data instanceof ArrayBuffer) {
      const uint8Array = new Uint8Array(data);
      return btoa(String.fromCharCode(...uint8Array));
    }

    // If it's a Uint8Array, convert to base64
    if (typeof Uint8Array !== 'undefined' && data instanceof Uint8Array) {
      return btoa(String.fromCharCode(...data));
    }

    console.error(`[convertResponseDataToBase64] Unsupported data type: ${typeof data}`, data);
    throw new Error(`Unsupported data type for base64 conversion: ${typeof data}`);
  }

  joinUrl(base: string, path: string): string {
    return base.replace(/\/+$/, '') + '/' + path.replace(/^\/+/, '');
  }

  /**
   * Ensures that a directory exists in the Library/NoCloud/ directory.
   * @param directory {string} - The directory relative to /Library/NoCloud/ to ensure exists.
   * @returns {Promise<void>} - A promise that resolves when the directory is ensured.
   */
  async ensureDirectoryExists(directory: string): Promise<void> {
    console.log('[ensureDirectoryExists]', directory);
    if (await this.directoryExists(directory)) {
      console.log(`📁 Directory already exists: ${directory}`);
      return;
    }
    try {
      await Filesystem.mkdir({
        path: directory,
        directory: Directory.LibraryNoCloud,
        recursive: true,
      });
      console.debug(`✅ Created directory: ${directory}`);
    } catch (error) {
      if (error instanceof Error && error.message.includes('Directory already exists')) {
        console.log(`📁 Directory already exists: ${directory}`);
        return;
      } else {
        console.error('⚠️ Error creating directory', error);
        throw error;
      }
    }
  }

  async directoryExists(path: string): Promise<boolean> {
    try {
      await Filesystem.stat({ path, directory: Directory.LibraryNoCloud });
      return true;
    } catch {
      return false;
    }
  }

  async writeFile(path: string, data: string, encoding: Encoding | null = null): Promise<void> {
    console.log('[writeFile]', path, 'data length:', data.length, 'encoding:', encoding);

    // Determine if this is a text file or binary file based on extension
    const fileExtension = this.getFileExtension(path).toLowerCase();
    const textExtensions = [
      'json',
      'txt',
      'csv',
      'xml',
      'html',
      'yml',
      'yaml',
      'toml',
      'ini',
      'conf',
    ];
    const isTextFile = textExtensions.includes(fileExtension);

    // For text files, use UTF-8 encoding if none specified
    if (encoding === null && isTextFile) {
      console.log(`[writeFile] Writing text file with UTF-8: ${path}`);
      await Filesystem.writeFile({
        path,
        data,
        directory: Directory.LibraryNoCloud,
        encoding: Encoding.UTF8,
      });
    } else if (encoding !== null) {
      console.log(
        `[writeFile] Writing file with explicit encoding: ${path}, encoding: ${encoding}`
      );
      await Filesystem.writeFile({
        path,
        data,
        directory: Directory.LibraryNoCloud,
        encoding,
      });
    } else {
      console.log(`[writeFile] Writing binary file without encoding: ${path}`);
      // For binary files, ensure we're writing base64 data correctly
      // The data should already be base64 encoded from the download process
      await Filesystem.writeFile({
        path,
        data,
        directory: Directory.LibraryNoCloud,
        // Don't specify encoding for binary files - let Capacitor handle base64
      });
    }

    // Debug: Try to get the URI of the written file
    try {
      const uriResult = await Filesystem.getUri({
        path,
        directory: Directory.LibraryNoCloud,
      });
      console.log(`[writeFile] ✅ File written successfully: ${path}`);
      console.log(`[writeFile] 📍 File URI: ${uriResult.uri}`);

      // For image files, also check if we can read them back
      if (fileExtension === 'jpg' || fileExtension === 'jpeg' || fileExtension === 'png') {
        try {
          const statResult = await Filesystem.stat({
            path,
            directory: Directory.LibraryNoCloud,
          });
          console.log(`[writeFile] 📊 File stats:`, statResult);
        } catch (statError) {
          console.warn(`[writeFile] ⚠️ Could not get file stats for ${path}:`, statError);
        }
      }
    } catch (uriError) {
      console.error(`[writeFile] ❌ Could not get URI for written file ${path}:`, uriError);
    }
  }

  getFileExtension(url: string): string {
    const parts = url.split('.');
    return parts[parts.length - 1];
  }

  /**
   * Test method to debug hash comparison issues.
   * This can be called from the browser console to test hash generation.
   */
  async testHashGeneration(filePath: string): Promise<void> {
    try {
      console.log(`[testHashGeneration] Testing hash for: ${filePath}`);

      // Read the file
      const { data } = await Filesystem.readFile({
        path: filePath,
        directory: Directory.LibraryNoCloud,
      });

      if (typeof data !== 'string') {
        console.error('[testHashGeneration] Data is not a string');
        return;
      }

      console.log(`[testHashGeneration] File size: ${data.length} base64 chars`);
      console.log(`[testHashGeneration] Base64 preview: ${data.substring(0, 100)}...`);

      // Generate hash
      const hash = await this.sha256FromBase64(data);
      console.log(`[testHashGeneration] Generated hash: ${hash}`);

      // Also test with a simple string to verify the hash function works
      const testString = 'Hello, World!';
      const testBase64 = btoa(testString);
      const testHash = await this.sha256FromBase64(testBase64);
      console.log(`[testHashGeneration] Test string "${testString}" -> hash: ${testHash}`);
    } catch (error) {
      console.error('[testHashGeneration] Error:', error);
    }
  }

  /**
   * Debug method to download a file directly and compare its hash with the local version.
   * This helps identify if the issue is with file storage or hash generation.
   */
  async debugFileComparison(remotePath: string): Promise<void> {
    try {
      console.log(`[debugFileComparison] Comparing remote and local versions of: ${remotePath}`);

      // Download the file directly from remote
      const remoteUrl = this.joinUrl(
        this.configService.get<string>('assetBaseUrl') ?? '',
        remotePath
      );

      const response = await CapacitorHttp.get({
        url: remoteUrl,
        responseType: 'blob',
      });

      if (!response.data) {
        console.error('[debugFileComparison] Failed to download remote file');
        return;
      }

      // Convert remote data to base64
      const remoteBase64 = await this.convertResponseDataToBase64(response.data);
      const remoteHash = await this.sha256FromBase64(remoteBase64);

      console.log(`[debugFileComparison] Remote file hash: ${remoteHash}`);
      console.log(`[debugFileComparison] Remote file size: ${remoteBase64.length} base64 chars`);

      // Read local file
      const fileExtension = this.getFileExtension(remotePath).toLowerCase();
      const isDatabaseFile = fileExtension === 'db';
      const localFilePath = isDatabaseFile
        ? `databases/${remotePath.split('/').pop()}`
        : remotePath;

      try {
        const { data: localData } = await Filesystem.readFile({
          path: localFilePath,
          directory: Directory.LibraryNoCloud,
        });

        if (typeof localData === 'string') {
          const localHash = await this.sha256FromBase64(localData);
          console.log(`[debugFileComparison] Local file hash: ${localHash}`);
          console.log(`[debugFileComparison] Local file size: ${localData.length} base64 chars`);
          console.log(`[debugFileComparison] Hashes match: ${remoteHash === localHash}`);

          if (remoteHash !== localHash) {
            console.log(`[debugFileComparison] ❌ Hash mismatch detected!`);
            console.log(
              `[debugFileComparison] Remote base64 starts with: ${remoteBase64.substring(0, 100)}...`
            );
            console.log(
              `[debugFileComparison] Local base64 starts with: ${localData.substring(0, 100)}...`
            );
          } else {
            console.log(`[debugFileComparison] ✅ Hashes match perfectly!`);
          }
        } else {
          console.error('[debugFileComparison] Local data is not a string');
        }
      } catch (localError) {
        console.error('[debugFileComparison] Error reading local file:', localError);
      }
    } catch (error) {
      console.error('[debugFileComparison] Error:', error);
    }
  }

  private async getNetworkInfo(): Promise<{ connected: boolean; type: string }> {
    try {
      const status = await Network.getStatus();
      return {
        connected: status.connected,
        type: status.connectionType,
      };
    } catch (error) {
      return {
        connected: navigator.onLine,
        type: 'unknown',
      };
    }
  }
}
