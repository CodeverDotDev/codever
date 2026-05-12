import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Note } from '../../core/model/note';

@Injectable()
export class PublicNotesService {
  private publicNotesApiBaseUrl = '';

  constructor(private httpClient: HttpClient) {
    this.publicNotesApiBaseUrl = environment.API_URL + '/public/notes';
  }

  searchPublicNotes(
    searchText: string,
    limit: number,
    page: number,
    sort: string,
    include: string
  ): Observable<Note[]> {
    const params = new HttpParams()
      .set('q', searchText)
      .set('page', page.toString())
      .set('sort', sort)
      .set('limit', limit.toString())
      .set('include', include);
    return this.httpClient.get<Note[]>(this.publicNotesApiBaseUrl, { params });
  }

  getPublicNoteById(noteId: string): Observable<Note> {
    return this.httpClient.get<Note>(`${this.publicNotesApiBaseUrl}/${noteId}`);
  }

  getSharedNoteBySharableId(shareableId: string): Observable<Note> {
    return this.httpClient.get<Note>(
      `${this.publicNotesApiBaseUrl}/shared/${shareableId}`
    );
  }
}

