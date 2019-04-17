import {Injectable} from '@angular/core';

import {Observable} from 'rxjs';

import {environment} from 'environments/environment';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {UserData} from './model/user-data';
import {Bookmark} from './model/bookmark';
import {shareReplay} from 'rxjs/operators';

@Injectable()
export class UserService {

  private usersApiBaseUrl = '';  // URL to web api
  private headers = new HttpHeaders({'Content-Type': 'application/json'});

  constructor(private httpClient: HttpClient) {
    this.usersApiBaseUrl = environment.API_URL + '/personal/users';
  }

  updateUserData(userData: UserData): Observable<UserData> {
    return this.httpClient
      .put(`${this.usersApiBaseUrl}/${userData.userId}`, JSON.stringify(userData), {headers: this.headers})
      .pipe(shareReplay(1));
  }

  getUserData(userId: string): Observable<UserData> {
    return this.httpClient
      .get<UserData>(`${this.usersApiBaseUrl}/${userId}` );
  }

  getLaterReads(userId: string): Observable<Bookmark[]> {
    return this.httpClient
      .get<Bookmark[]>(`${this.usersApiBaseUrl}/${userId}/later-reads` );
  }

  getStarredBookmarks(userId: string): Observable<Bookmark[]> {
    return this.httpClient
      .get<Bookmark[]>(`${this.usersApiBaseUrl}/${userId}/stars` );
  }

}
