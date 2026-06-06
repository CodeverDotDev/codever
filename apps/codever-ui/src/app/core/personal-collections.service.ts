import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';

import { Collection } from './model/collection';
import { environment } from '../../environments/environment';

@Injectable()
export class PersonalCollectionsService {
  private readonly baseUrl = environment.API_URL + '/personal/users';
  private headers = new HttpHeaders({ 'Content-Type': 'application/json' });

  constructor(private httpClient: HttpClient) {}

  private collectionsUrl(userId: string): string {
    return `${this.baseUrl}/${userId}/collections`;
  }

  getUserCollections(
    userId: string,
    searchText?: string,
    page: number = 1,
    limit: number = 20
  ): Observable<Collection[]> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (searchText) {
      params = params.set('q', searchText);
    }

    return this.httpClient
      .get<Collection[]>(this.collectionsUrl(userId), { params })
      .pipe(shareReplay(1));
  }

  getCollectionById(
    userId: string,
    collectionId: string
  ): Observable<Collection> {
    return this.httpClient
      .get<Collection>(`${this.collectionsUrl(userId)}/${collectionId}`)
      .pipe(shareReplay(1));
  }

  getCollectionsContainingResource(
    userId: string,
    resourceId: string
  ): Observable<Collection[]> {
    return this.httpClient
      .get<Collection[]>(
        `${this.collectionsUrl(userId)}/containing/${resourceId}`
      )
      .pipe(shareReplay(1));
  }

  createCollection(
    userId: string,
    collection: Partial<Collection>
  ): Observable<Collection> {
    return this.httpClient
      .post<Collection>(
        this.collectionsUrl(userId),
        JSON.stringify(collection),
        { headers: this.headers }
      )
      .pipe(shareReplay(1));
  }

  updateCollection(
    userId: string,
    collectionId: string,
    collection: Partial<Collection>
  ): Observable<Collection> {
    return this.httpClient
      .put<Collection>(
        `${this.collectionsUrl(userId)}/${collectionId}`,
        JSON.stringify(collection),
        { headers: this.headers }
      )
      .pipe(shareReplay(1));
  }

  deleteCollection(userId: string, collectionId: string): Observable<void> {
    return this.httpClient
      .delete<void>(`${this.collectionsUrl(userId)}/${collectionId}`, {
        headers: this.headers,
      })
      .pipe(shareReplay(1));
  }

  addItemToCollection(
    userId: string,
    collectionId: string,
    resourceId: string,
    resourceType: 'bookmark' | 'note'
  ): Observable<Collection> {
    return this.httpClient
      .post<Collection>(
        `${this.collectionsUrl(userId)}/${collectionId}/items`,
        JSON.stringify({ resourceId, resourceType }),
        { headers: this.headers }
      )
      .pipe(shareReplay(1));
  }

  removeItemFromCollection(
    userId: string,
    collectionId: string,
    resourceId: string
  ): Observable<Collection> {
    return this.httpClient
      .delete<Collection>(
        `${this.collectionsUrl(userId)}/${collectionId}/items/${resourceId}`,
        { headers: this.headers }
      )
      .pipe(shareReplay(1));
  }
}

