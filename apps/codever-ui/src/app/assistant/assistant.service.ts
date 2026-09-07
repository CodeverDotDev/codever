import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AssistantResponse } from './assistant.model';

@Injectable()
export class AssistantService {
  private personalApiBaseUrl = environment.API_URL + '/personal/users';
  private headers = new HttpHeaders({ 'Content-Type': 'application/json' });

  constructor(private httpClient: HttpClient) {}

  /**
   * Ask the in-app AI assistant a question over the user's own bookmarks/notes.
   *
   * @param userId  the current user's id
   * @param message the question
   * @param history prior turns for follow-up context ({role, content})
   */
  chat(
    userId: string,
    message: string,
    history: { role: 'user' | 'assistant'; content: string }[] = []
  ): Observable<AssistantResponse> {
    return this.httpClient.post<AssistantResponse>(
      `${this.personalApiBaseUrl}/${userId}/assistant/chat`,
      JSON.stringify({ message, history }),
      { headers: this.headers }
    );
  }
}

