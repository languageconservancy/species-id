import { Injectable } from '@angular/core';
import { VoiceRecorder } from 'capacitor-voice-recorder';
import { Directory } from '@capacitor/filesystem';
import { Subject, Observable, BehaviorSubject } from 'rxjs';

export enum RecordingState {
  NotRecording,
  Recording,
  Converting,
}

@Injectable({
  providedIn: 'root',
})
export class SearchService {
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
      console.error('Error requesting user permission to record audio:', error);
    }
  }

  async startRecording(): Promise<void> {
    await this.requestUserPermissionToRecordAudio();
    if (!this.gotUserPermissionToRecordAudio) {
      throw new Error('User did not grant permission to record audio');
    }

    try {
      console.log('Recording started');
      const result = await VoiceRecorder.startRecording({
        directory: Directory.Data,
        subDirectory: 'recordings',
      });
      if (!result.value) {
        throw new Error('Recording failed');
      }
      // Update the observable when recording starts
      this.recordingStateSubject.next(RecordingState.Recording);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  }

  async stopRecording(): Promise<void> {
    try {
      const result = await VoiceRecorder.stopRecording();
      if (!result.value) {
        throw new Error('Recording failed');
      }
      // Update the observable when recording stops
      this.recordingStateSubject.next(RecordingState.Converting);
      this.convertRecordingToText();
    } catch (error) {
      console.error('Error stopping recording:', error);
      // Still update the observable even if there's an error
      this.recordingStateSubject.next(RecordingState.NotRecording);
    }
  }

  async convertRecordingToText(): Promise<void> {
    const result = 'baa';
    // Emit the text so the component can update the searchbar input
    await new Promise((resolve) => setTimeout(resolve, 1000));
    this.recordingStateSubject.next(RecordingState.NotRecording);
    this.recordingTextSubject.next(result);
  }
}
