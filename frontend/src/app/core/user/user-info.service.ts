import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { environment } from 'environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { shareReplay } from 'rxjs/operators';
import { UserInfoOidc } from '../model/user-info.oidc';

@Injectable()
export class UserInfoService {

  private usersInfoEndpoint = '';  // URL to web api

  constructor(private httpClient: HttpClient) {
    this.usersInfoEndpoint = environment.keycloak.url + '/realms/' + environment.keycloak.realm + '/protocol/openid-connect/userinfo';
  }


  getUserInfo(): Observable<UserInfoOidc> {
    return this.httpClient
      .get<UserInfoOidc>(this.usersInfoEndpoint)
      .pipe(shareReplay());
  }

}
