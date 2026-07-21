import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AiRefinePayload {
  title: string;
  content: string;
  tags: string[];
  reference?: string;
  customPrompt?: string;
}

export interface AiRefineResult {
  refinedContent: string;
  suggestedTags: string[];
  suggestedTitle: string;
}

export interface AiRefineBookmarkPayload {
  name: string;
  location: string;
  tags: string[];
  description?: string;
  customPrompt?: string;
}

export interface AiRefineBookmarkResult {
  refinedName: string;
  suggestedTags: string[];
  refinedDescription: string;
  pageReachable: boolean;
}

@Injectable()
export class AiRefineService {
  private personalApiBaseUrl = environment.API_URL + '/personal/users';
  private headers = new HttpHeaders({ 'Content-Type': 'application/json' });

  constructor(private httpClient: HttpClient) {}

  refineNote(
    userId: string,
    payload: AiRefinePayload
  ): Observable<AiRefineResult> {
    return this.httpClient.post<AiRefineResult>(
      `${this.personalApiBaseUrl}/${userId}/notes/ai-refine`,
      JSON.stringify(payload),
      { headers: this.headers }
    );
  }

  refineBookmark(
    userId: string,
    payload: AiRefineBookmarkPayload
  ): Observable<AiRefineBookmarkResult> {
    return this.httpClient.post<AiRefineBookmarkResult>(
      `${this.personalApiBaseUrl}/${userId}/bookmarks/ai-refine`,
      JSON.stringify(payload),
      { headers: this.headers }
    );
  }
}
