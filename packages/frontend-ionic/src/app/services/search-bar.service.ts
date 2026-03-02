import { Injectable } from '@angular/core';
import { VoiceRecorder } from 'capacitor-voice-recorder';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Subject, Observable, BehaviorSubject } from 'rxjs';
import { ASSET_PATHS, RECORDING_MAX_DURATION_MS } from 'app/constants/app-consts';

export enum RecordingState {
  NotRecording,
  Recording,
  Converting,
  ConvertingBecauseMaxDurationReached,
}

@Injectable({
  providedIn: 'root',
})
export class SearchBarService {
  private searchSubject: Subject<string> = new Subject<string>();
  public search$: Observable<string> = this.searchSubject.asObservable();

  // Use BehaviorSubject for reactive template binding
  private recordingStateSubject: BehaviorSubject<RecordingState> =
    new BehaviorSubject<RecordingState>(RecordingState.NotRecording);
  public recordingState$: Observable<RecordingState> = this.recordingStateSubject.asObservable();

  // Subject for when recording text is ready to be set in the input
  private recordingTextSubject: Subject<string> = new Subject<string>();
  public recordingText$: Observable<string> = this.recordingTextSubject.asObservable();

  // Getter for direct access (less reliable for templates)
  get recordingState(): RecordingState {
    return this.recordingStateSubject.value;
  }

  private gotUserPermissionToRecordAudio: boolean = false;
  private recordingTimeout: number = 0;

  constructor() {}

  setSearch(query: string): void {
    this.searchSubject.next(query);
  }

  async requestUserPermissionToRecordAudio(): Promise<void> {
    if (this.gotUserPermissionToRecordAudio) {
      return;
    }
    try {
      const result = await VoiceRecorder.requestAudioRecordingPermission();
      this.gotUserPermissionToRecordAudio = result.value;
    } catch (error) {
      console.error(
        ASSET_PATHS.ERROR_EMOJI,
        'Error requesting user permission to record audio:',
        error
      );
    }
  }

  async startRecording(): Promise<void> {
    await this.requestUserPermissionToRecordAudio();
    if (!this.gotUserPermissionToRecordAudio) {
      throw new Error('User did not grant permission to record audio');
    }

    try {
      const result = await VoiceRecorder.startRecording({
        directory: Directory.Data,
        subDirectory: 'recordings',
      });
      if (!result.value) {
        throw new Error('Recording failed');
      }
      // Update the observable when recording starts
      this.recordingStateSubject.next(RecordingState.Recording);
      this.stopRecordingAfterMaxDuration();
    } catch (error) {
      console.error(ASSET_PATHS.ERROR_EMOJI, 'Error starting recording:', error);
    }
  }
  private stopRecordingAfterMaxDuration(): void {
    this.recordingTimeout = window.setTimeout(() => {
      this.stopRecording(false);
    }, RECORDING_MAX_DURATION_MS);
  }

  async stopRecording(userTriggered: boolean = true): Promise<void> {
    try {
      if (this.recordingTimeout && !userTriggered) {
        clearTimeout(this.recordingTimeout);
      }
      const result = await VoiceRecorder.stopRecording();
      if (!result.value) {
        throw new Error('Recording failed');
      }
      // Update the observable when recording stops
      this.recordingStateSubject.next(
        userTriggered
          ? RecordingState.Converting
          : RecordingState.ConvertingBecauseMaxDurationReached
      );
      this.convertRecordingToText(result.value);
    } catch (error) {
      console.error(ASSET_PATHS.ERROR_EMOJI, 'Error stopping recording:', error);
      // Still update the observable even if there's an error
      this.recordingStateSubject.next(RecordingState.NotRecording);
    }
  }

  async convertRecordingToText({
    recordDataBase64,
    msDuration,
    mimeType,
    path,
  }: {
    recordDataBase64?: string;
    msDuration: number;
    mimeType: string;
    path?: string;
  }): Promise<void> {
    const result = 'baa';
    // Emit the text so the component can update the searchbar input
    await new Promise((resolve) => setTimeout(resolve, 1000));
    this.recordingStateSubject.next(RecordingState.NotRecording);
    this.recordingTextSubject.next(result);
    await this.deleteRecording(path);
  }

  async deleteRecording(path?: string): Promise<void> {
    try {
      await Filesystem.deleteFile({
        path: path || 'recordings/*',
        directory: Directory.Data,
      });
    } catch (error) {
      console.error(ASSET_PATHS.ERROR_EMOJI, 'Error deleting recording:', error);
    }
  }
}
