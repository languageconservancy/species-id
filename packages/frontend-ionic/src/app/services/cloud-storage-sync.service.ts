import { Injectable } from '@angular/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { ConfigService } from 'app/services/config.service';
import { Storage } from '@ionic/storage-angular';
import { StorageReadyService } from 'app/services/storage-ready.service';
import { CapacitorHttp } from '@capacitor/core';

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
  private readonly indexUrl: string = '';
  private dbIsReady: boolean = false;
  private dbIsReadyPromise: Promise<void> | null = null;
  private dbIsReadyResolve: ((value: void | PromiseLike<void>) => void) | null = null;
  private indexOfCloudStorage: any;

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
  }

  /**
   * Checks if the initial sync with the S3 storage is complete,
   * meaning media files have been downloaded and saved in persistent storage.
   * @returns {Promise<boolean>} - True if the initial sync is complete, false otherwise.
   */
  async checkIsInitialSyncComplete(): Promise<boolean> {
    await this.storageReady.ready();
    const isInitialSyncComplete = await this.storage.get(this.INITIAL_SYNC_COMPLETE_KEY);
    return isInitialSyncComplete ?? false;
  }

  async waitUntilDbIsReady(): Promise<void> {
    await this.storageReady.ready();
    if (this.dbIsReady) {
      return;
    }
    await this.dbIsReadyPromise;
  }

  private setDbIsReady(): void {
    console.log('[setDbIsReady]');
    this.dbIsReady = true;
    if (this.dbIsReadyResolve) {
      this.dbIsReadyResolve();
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
    if (!navigator.onLine) {
      throw new Error(
        'No internet connection. Initial sync requires online access. Reopen the app when you have internet access.'
      );
    }

    // Download and save the remote index.json
    console.log('[runInitialSync] Downloading index.json from S3');
    const remoteIndex: string = await this.downloadRemoteIndexJson();
    await this.ensureDirectoryExists('');
    await this.writeFile('index.json', remoteIndex, Encoding.UTF8);

    // Download database files
    await this.syncDatabaseFiles();

    // Download all other files recursively (excluding databases)
    await this.syncAllFiles();

    // Mark initial sync as complete
    await this.storage.set(this.INITIAL_SYNC_COMPLETE_KEY, true);

    this.setDbIsReady();
  }

  /**
   * Gets the index.json from the S3 index URL, which describes the contents in S3.
   */
  private async downloadRemoteIndexJson(): Promise<string> {
    console.log('[downloadRemoteIndexJson]');
    try {
      const response = await CapacitorHttp.get({
        url: this.indexUrl,
      });
      if (!response.data) {
        throw new Error(`Failed to download remote index. URL: ${this.indexUrl}`);
      }
      const remoteIndex = await response.data;
      if (typeof remoteIndex === 'string') {
        this.indexOfCloudStorage = JSON.parse(remoteIndex);
        return remoteIndex;
      } else {
        this.indexOfCloudStorage = remoteIndex;
        return JSON.stringify(remoteIndex);
      }
    } catch (error) {
      console.error('⚠️ Error downloading remote index', error);
      throw error;
    }
  }

  /**
   * Syncs database files from S3.
   * Downloads database files that don't exist locally or have different hashes.
   */
  async syncDatabaseFiles(): Promise<void> {
    console.log('[syncDatabaseFiles]');

    if (!this.indexOfCloudStorage || !this.indexOfCloudStorage.databases) {
      console.log('[syncDatabaseFiles] No database files to sync');
      return;
    }

    for (const { path, hash } of this.indexOfCloudStorage.databases) {
      const exists = await this.checkAndCompareHash(path, hash);
      if (!exists) {
        console.log(`[syncDatabaseFiles] Downloading database file: ${path}`);

        // Determine file type and use appropriate download method
        const fileExtension = this.getFileExtension(path).toLowerCase();
        if (fileExtension === 'json') {
          await this.downloadJsonFile(path);
        } else {
          await this.downloadBinaryFile(path);
        }
      } else {
        console.debug(`[syncDatabaseFiles] Database file already exists: ${path}`);
      }
    }
  }

  /**
   * Syncs all files from S3 recursively, excluding the databases directory.
   * This dynamically handles any directory structure defined in index.json.
   */
  async syncAllFiles(): Promise<void> {
    console.log('[syncAllFiles]');

    if (!this.indexOfCloudStorage) {
      console.log('[syncAllFiles] No index data available');
      return;
    }

    // Recursively process all directories except 'databases'
    await this.syncDirectoryRecursive(this.indexOfCloudStorage, '');
  }

  /**
   * Recursively syncs files from a directory structure.
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
    if (!navigator.onLine) {
      throw new Error('Internet connection required to download files for offline mode');
    }

    if (!this.indexOfCloudStorage) {
      console.log('[downloadAllFilesForOffline] No index data available');
      return;
    }

    // Count total files first
    const totalFiles = this.countFilesRecursive(this.indexOfCloudStorage, 'databases');
    let downloadedCount = 0;

    console.log(`[downloadAllFilesForOffline] Found ${totalFiles} files to download`);

    // Download all files recursively
    await this.downloadDirectoryRecursive(
      this.indexOfCloudStorage,
      '',
      totalFiles,
      downloadedCount
    );
  }

  /**
   * Counts files recursively in a directory structure, excluding specified directories.
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
   * Recursively downloads files from a directory structure.
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
   * This is much simpler than the hybrid approach - just check if files need updating.
   */
  async checkForUpdates(): Promise<boolean> {
    console.log('[checkForUpdates]');
    this.setDbIsReady();

    if (!navigator.onLine) {
      console.warn('[checkForUpdates] No internet connection, skipping update check');
      return false;
    }

    // Re-fetch the remote index to get latest hashes
    try {
      const remoteIndex: string = await this.downloadRemoteIndexJson();
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
   * Downloads and saves a JSON file from S3.
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
   * Downloads and saves a binary file (database, image, etc.) from S3.
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
   * Checks if the file exists and the hash matches.
   */
  private async checkAndCompareHash(path: string, expectedHash: string): Promise<boolean> {
    console.log('[checkAndCompareHash]', path, expectedHash);
    try {
      const { data } = await Filesystem.readFile({ path, directory: Directory.LibraryNoCloud });
      if (typeof data !== 'string') {
        // If data is not a string, we cannot compute the hash
        return false;
      }
      const localHash = await this.sha256FromBase64(data);
      return localHash === expectedHash;
    } catch {
      return false; // File doesn't exist or error reading file
    }
  }

  private async sha256FromBase64(base64: string): Promise<string> {
    const raw = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const hashBuffer = await crypto.subtle.digest('SHA-256', raw);
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

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
      await Filesystem.writeFile({
        path,
        data,
        directory: Directory.LibraryNoCloud,
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
}
