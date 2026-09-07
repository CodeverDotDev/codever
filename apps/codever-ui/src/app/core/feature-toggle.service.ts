import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { shareReplay, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface FeatureToggles {
  aiNoteRefine: boolean;
  aiAssistant: boolean;
  mcpServer: boolean;
}

@Injectable()
export class FeatureToggleService {
  private featureToggleApiBaseUrl = environment.API_URL + '/feature-toggle';
  private featureTogglesCache$: Observable<FeatureToggles> | null = null;

  constructor(private httpClient: HttpClient) {}

  /**
   * Fetch ALL feature toggles for the current user in a single request.
   * The result is cached and shared across subscribers, so the individual
   * `is*Enabled()` helpers below reuse this one HTTP call.
   */
  getFeatureToggles(): Observable<FeatureToggles> {
    if (!this.featureTogglesCache$) {
      this.featureTogglesCache$ = this.httpClient
        .get<FeatureToggles>(this.featureToggleApiBaseUrl)
        .pipe(shareReplay(1));
    }
    return this.featureTogglesCache$;
  }

  /** Force-refresh all feature toggles (clears cache) */
  refreshFeatureToggles(): Observable<FeatureToggles> {
    this.featureTogglesCache$ = null;
    return this.getFeatureToggles();
  }

  /** Check if the AI note refine feature is enabled for the current user. */
  isAiNoteRefineEnabled(): Observable<boolean> {
    return this.getFeatureToggles().pipe(
      map((toggles) => toggles.aiNoteRefine)
    );
  }

  /** Check if the in-app AI assistant (DeepSeek chat) feature is enabled. */
  isAiAssistantEnabled(): Observable<boolean> {
    return this.getFeatureToggles().pipe(map((toggles) => toggles.aiAssistant));
  }

  /** Check if the MCP server feature is enabled for the current user. */
  isMcpServerEnabled(): Observable<boolean> {
    return this.getFeatureToggles().pipe(map((toggles) => toggles.mcpServer));
  }
}
