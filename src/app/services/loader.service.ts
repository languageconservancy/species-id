import { Injectable, computed, signal } from '@angular/core';

/**
 * Drives the app-root loader (e.g. explore lists loading from SQL).
 * Refcounted so overlapping begins/ends stay balanced.
 */
@Injectable({
  providedIn: 'root',
})
export class LoaderService {
  private readonly activeCount = signal(0);

  readonly isLoading = computed(() => this.activeCount() > 0);

  begin(): void {
    this.activeCount.update((n) => n + 1);
  }

  end(): void {
    this.activeCount.update((n) => Math.max(0, n - 1));
  }
}
