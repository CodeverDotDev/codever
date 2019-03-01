import {Injectable} from '@angular/core';

import {Observable} from 'rxjs';

import {environment} from 'environments/environment';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {UserData} from './model/user-data';
import {Codingmark} from './model/codingmark';

@Injectable()
export class UserService {

  private usersApiBaseUrl = '';  // URL to web api
  private headers = new HttpHeaders({'Content-Type': 'application/json'});

  constructor(private httpClient: HttpClient) {
    this.usersApiBaseUrl = environment.API_URL + '/personal/users';
  }

  updateUserData(userData: UserData): Observable<UserData> {
    return this.httpClient
      .put(`${this.usersApiBaseUrl}/${userData.userId}`, JSON.stringify(userData), {headers: this.headers});
  }

  getUserData(userId: string): Observable<UserData> {
    return this.httpClient
      .get<UserData>(`${this.usersApiBaseUrl}/${userId}` );
  }

  getLaterReads(userId: string): Observable<Codingmark[]> {
    return this.httpClient
      .get<Codingmark[]>(`${this.usersApiBaseUrl}/${userId}/later-reads` );
  }

}
