import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Note } from '../../core/model/note';

@Injectable()
export class PublicNotesService {
  private publicNotesApiBaseUrl = '';

  constructor(private httpClient: HttpClient) {
    this.publicNotesApiBaseUrl = environment.API_URL + '/public/notes';
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

