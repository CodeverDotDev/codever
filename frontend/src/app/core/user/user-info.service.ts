import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';

import { environment } from 'environments/environment';
import { shareReplay } from 'rxjs/operators';
import { UserInfoOidc } from '../model/user-info.oidc';
import { HttpClientLocalStorageService, HttpOptions } from '../cache/http-client-local-storage.service';

import { localStorageKeys } from '../model/localstorage.cache-keys';

@Injectable()
export class UserInfoService {

  private usersInfoEndpoint = '';  // URL to web api

  constructor(private httpClientLocalStorageService: HttpClientLocalStorageService) {
    this.usersInfoEndpoint = environment.keycloak.url + '/realms/' + environment.keycloak.realm + '/protocol/openid-connect/userinfo';
  }

  getUserInfo(): Observable<UserInfoOidc> {
    const options: HttpOptions = {
      url: this.usersInfoEndpoint,
      key: localStorageKeys.userInfoOidc,
      cacheHours: 24,
      isSensitive: true
    }; // cache it for a day

    return this.httpClientLocalStorageService
      .get<UserInfoOidc>(options)
      .pipe(shareReplay());
  }

}
