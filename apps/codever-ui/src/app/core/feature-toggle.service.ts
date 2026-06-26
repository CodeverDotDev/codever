import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { shareReplay, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable()
export class FeatureToggleService {
  private featureToggleApiBaseUrl = environment.API_URL + '/feature-toggle';
  private aiNoteRefineCache$: Observable<boolean> | null = null;

  constructor(private httpClient: HttpClient) {}

  /**
   * Check if the AI note refine feature is enabled for the current user.
   * Results are cached and shared across subscribers.
   */
  isAiNoteRefineEnabled(): Observable<boolean> {
    if (!this.aiNoteRefineCache$) {
      this.aiNoteRefineCache$ = this.httpClient
        .get<{ enabled: boolean }>(
          `${this.featureToggleApiBaseUrl}/ai-note-refine`
        )
        .pipe(
          map((response) => response.enabled),
          shareReplay(1)
        );
    }
    return this.aiNoteRefineCache$;
  }

  /** Force-refresh the feature toggle check (clears cache) */
  refreshAiNoteRefine(): Observable<boolean> {
    this.aiNoteRefineCache$ = null;
    return this.isAiNoteRefineEnabled();
  }
}
