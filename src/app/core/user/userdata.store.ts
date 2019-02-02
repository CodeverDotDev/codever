import {BehaviorSubject, Observable} from 'rxjs';

import {Injectable} from '@angular/core';
import {Logger} from '../logger.service';
import {ErrorService} from '../error/error.service';
import {Router} from '@angular/router';

import {KeycloakService} from 'keycloak-angular';
import {UserData} from '../model/user-data';
import {UserService} from '../user.service';

@Injectable()
export class UserDataStore {

  private _userData: BehaviorSubject<UserData> = new BehaviorSubject(undefined);

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

      });
    });

    keycloakService.loadUserProfile().then(keycloakProfile => {
      this.userId = keycloakProfile.id;
      this.loadInitialData(this.userId);
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
      error => {
      }
    );
  }

  public getUserDataValue(): UserData {
    return this._userData.getValue();
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

