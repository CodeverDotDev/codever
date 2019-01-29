import {Injectable} from '@angular/core';

import {Observable} from 'rxjs';

import {environment} from 'environments/environment';
import {HttpClient} from '@angular/common/http';
import {UserData} from './model/user-data';

@Injectable()
export class UserService {

  private usersApiBaseUrl = '';  // URL to web api

  constructor(private httpClient: HttpClient) {
    this.usersApiBaseUrl = environment.API_URL + '/personal/users';
  }

  updateUserData(userData: UserData): Observable<any> {
    return this.httpClient
      .put(`${this.usersApiBaseUrl}/${userData.userId}`, JSON.stringify(userData));
  }

  getUserData(userId: string): Observable<UserData> {
    return this.httpClient
      .get<UserData>(`${this.usersApiBaseUrl}/${userId}` );
  }

}
