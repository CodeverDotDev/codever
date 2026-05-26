import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, shareReplay } from 'rxjs/operators';
import { Note } from '../../core/model/note';
import { Router } from '@angular/router';

@Injectable()
export class PublicNotesService {
  private publicNotesApiBaseUrl = '';

  constructor(private httpClient: HttpClient, private router: Router) {
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

  getLatestPublicNotes(page: number, limit: number): Observable<Note[]> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    return this.httpClient.get<Note[]>(this.publicNotesApiBaseUrl, { params });
  }

  getPublicNoteById(noteId: string): Observable<Note> {
    return this.httpClient
      .get<Note>(`${this.publicNotesApiBaseUrl}/${noteId}`)
      .pipe(
        shareReplay(1),
        catchError(() => {
          this.router.navigate(['/404-note'], {
            queryParams: { noteId: noteId },
          });
          return throwError('Error 404');
        })
      );
  }

  getSharedNoteBySharableId(shareableId: string): Observable<Note> {
    return this.httpClient.get<Note>(
      `${this.publicNotesApiBaseUrl}/shared/${shareableId}`
    );
  }
}

