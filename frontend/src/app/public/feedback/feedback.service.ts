import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { Feedback } from '../../core/model/feedback';

@Injectable()
export class FeedbackService {
  private publicBookmarksApiBaseUrl = ''; // URL to web api
  private headers = new HttpHeaders({ 'Content-Type': 'application/json' });

  constructor(private httpClient: HttpClient) {
    this.publicBookmarksApiBaseUrl = environment.API_URL + '/public/feedback';
  }

  createFeedback(feedback: Feedback): Observable<any> {
    return this.httpClient.post(
      this.publicBookmarksApiBaseUrl,
      JSON.stringify(feedback),
      {
        headers: this.headers,
      }
    );
  }
}
