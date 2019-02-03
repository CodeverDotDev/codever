import {BehaviorSubject, Observable, ReplaySubject} from 'rxjs';

import {Injectable} from '@angular/core';
import {Logger} from '../logger.service';
import {ErrorService} from '../error/error.service';
import {Router} from '@angular/router';

import {KeycloakService} from 'keycloak-angular';
import {UserData} from '../model/user-data';
import {UserService} from '../user.service';
import {HttpErrorResponse} from '@angular/common/http';

@Injectable()
export class UserDataStore {

  private _userData: ReplaySubject<UserData> = new ReplaySubject(1);

  private userId: string;

  userData: UserData = {searches: []};

  constructor(private userService: UserService,
              private logger: Logger,
              private router: Router,
              private errorService: ErrorService,
              private keycloakService: KeycloakService,
  ) {
    this.keycloakService.isLoggedIn().then(value => {
      this.keycloakService.loadUserProfile().then(keycloakProfile => {
        this.userId = keycloakProfile.id;
        this.loadInitialData(this.userId);
      });
    });
  }

  public loadInitialData(userId: string) {
    this.userService.getUserData(userId).subscribe(data => {
        this.userData = data;
        this.userData.searches = this.userData.searches.sort((a, b) => {
          const result: number = a.lastAccessedAt == null ? (b.lastAccessedAt == null ? 0 : 1)
            : b.lastAccessedAt == null ? -1 : a.lastAccessedAt < b.lastAccessedAt ? 1 : a.lastAccessedAt > b.lastAccessedAt ? -1 : 0;
          return result;
        });

        this._userData.next(this.userData)
      },
      (errorResponse: HttpErrorResponse) => {
        if (errorResponse.status === 404 && errorResponse.error.title === 'User data was not found') {
          this._userData.next({});
        }
      }
    );
  }

  getUserData(): Observable<UserData> {
    return this._userData.asObservable();
  }

  updateUserData(userData: UserData): Observable<UserData> {
    const obs: Observable<any> = this.userService.updateUserData(userData);

    obs.subscribe(
      data => {
        this._userData.next(data);
      }
    );

    return obs;
  }

}

