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

@Injectable()
export class AiRefineService {
  private personalNotesApiBaseUrl = environment.API_URL + '/personal/users';
  private headers = new HttpHeaders({ 'Content-Type': 'application/json' });

  constructor(private httpClient: HttpClient) {}

  /**
   * Call the AI refine endpoint to polish note content, suggest tags,
   * and suggest a better title.
   */
  refineNote(
    userId: string,
    payload: AiRefinePayload
  ): Observable<AiRefineResult> {
    return this.httpClient.post<AiRefineResult>(
      `${this.personalNotesApiBaseUrl}/${userId}/notes/ai-refine`,
      JSON.stringify(payload),
      { headers: this.headers }
    );
  }
}
