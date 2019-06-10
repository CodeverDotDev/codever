import { Injectable } from '@angular/core';
import { Observable, ReplaySubject } from 'rxjs';
import { UserDataService } from '../user-data.service';
import { Logger } from '../logger.service';
import { ErrorService } from '../error/error.service';
import { UserInfoService } from './user-info.service';
import { UserInfoOidc } from '../model/user-info.oidc';

@Injectable()
export class UserInfoStore {

  private _userInfo: ReplaySubject<UserInfoOidc> = new ReplaySubject(1);
  public userInfoLoaded = false;

  private userId: string;

  constructor(private userService: UserDataService,
              private logger: Logger,
              private errorService: ErrorService,
              // private keycloakService: KeycloakService,
              private userInfoService: UserInfoService,
  ) {
/*    this.keycloakService.keycloakEvents$.subscribe(keycloakEvent => {
      if (keycloakEvent.type === KeycloakEventType.OnAuthLogout) {
        this.userInfoLoaded = false;
      }
    });

    this.keycloakService.isLoggedIn().then(isLoggedIn => {
      if (isLoggedIn) {
        this.userInfoService.getUserInfo().subscribe(userInfo => {
          this.loadInitialData();
        });
      }
    });*/
  }

  private loadInitialData() {
    this.userInfoService.getUserInfo().subscribe(data => {
        this.userId = data.sub;
        this._userInfo.next(data);
      }
    );
  }

  public getUserInfo$(): Observable<UserInfoOidc> {
    if ( !this.userInfoLoaded ) {
      this.loadInitialData();
      this.userInfoLoaded = true;
    }
    return this._userInfo.asObservable();
  }

}
