import { Injectable } from '@angular/core';

import { shareReplay } from 'rxjs/operators';

import { Observable } from 'rxjs';

import { environment } from 'environments/environment';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { UsedTag } from './model/used-tag';
import {
  HttpClientLocalStorageService,
  HttpOptions,
} from './cache/http-client-local-storage.service';
import { localStorageKeys } from './model/localstorage.cache-keys';
import { Note } from './model/note';

@Injectable()
export class PersonalNotesService {
  readonly personalNotesApiBaseUrl = environment.API_URL + '/personal/users';
  private headers = new HttpHeaders({ 'Content-Type': 'application/json' });

  constructor(
    private httpClient: HttpClient,
    private httpClientLocalStorageService: HttpClientLocalStorageService
  ) {}

  getPersonalNoteById(userId: string, noteId: string): Observable<Note> {
    return this.httpClient
      .get<Note>(`${this.personalNotesApiBaseUrl}/${userId}/notes/${noteId}`)
      .pipe(shareReplay(1));
  }

  getUserTagsForNotes(userId: String): Observable<UsedTag[]> {
    const options: HttpOptions = {
      url: `${this.personalNotesApiBaseUrl}/${userId}/notes/tags`,
      key: localStorageKeys.personalTagsNotes,
      cacheHours: 24,
      isSensitive: true,
    }; // cache it for a day

    return this.httpClientLocalStorageService
      .get<UsedTag[]>(options)
      .pipe(shareReplay());
  }

  getSuggestedNoteTags(userId: String): Observable<string[]> {
    return this.httpClient
      .get<string[]>(
        `${this.personalNotesApiBaseUrl}/${userId}/notes/suggested-tags`
      )
      .pipe(shareReplay(1));
  }

  updateNote(note: Note): Observable<any> {
    return this.httpClient
      .put(
        `${this.personalNotesApiBaseUrl}/${note.userId}/notes/${note._id}`,
        JSON.stringify(note),
        { headers: this.headers }
      )
      .pipe(shareReplay(1));
  }

  createNote(userId: string, note: Note): Observable<any> {
    return this.httpClient
      .post(
        `${this.personalNotesApiBaseUrl}/${userId}/notes`,
        JSON.stringify(note),
        {
          headers: this.headers,
          observe: 'response',
        }
      )
      .pipe(shareReplay(1));
  }

  deleteNoteById(userId: string, noteId: string): Observable<any> {
    return this.httpClient
      .delete(`${this.personalNotesApiBaseUrl}/${userId}/notes/${noteId}`, {
        headers: this.headers,
      })
      .pipe(shareReplay(1));
  }

  getFilteredPersonalNotes(
    searchText: string,
    limit: number,
    page: number,
    userId: string,
    include: string
  ) {
    const params = new HttpParams()
      .set('q', searchText)
      .set('page', page.toString())
      .set('limit', limit.toString())
      .set('include', include);

    return this.httpClient
      .get<Note[]>(`${this.personalNotesApiBaseUrl}/${userId}/notes`, {
        params: params,
      })
      .pipe(shareReplay(1));
  }

  getLatestNotes(userId: string) {
    return this.httpClient
      .get<Note[]>(`${this.personalNotesApiBaseUrl}/${userId}/notes`)
      .pipe(shareReplay(1));
  }
}
