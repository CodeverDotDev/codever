import { Injectable } from '@angular/core';
import { Observable, ReplaySubject } from 'rxjs';
import { UserDataService } from '../user-data.service';
import { Logger } from '../logger.service';
import { ErrorService } from '../error/error.service';
import { UserInfoService } from './user-info.service';
import { UserInfoOidc } from '../model/user-info.oidc';
import { map } from 'rxjs/operators';

@Injectable()
export class UserInfoStore {

  private _userInfo: ReplaySubject<UserInfoOidc> = new ReplaySubject(1);
  public userInfoLoaded = false;

  constructor(private userService: UserDataService,
              private logger: Logger,
              private errorService: ErrorService,
              private userInfoService: UserInfoService,
  ) {
  }

  private loadInitialOidcData() {
    this.userInfoService.getUserInfoOidc().subscribe(data => {
        this._userInfo.next(data);
      }
    );
  }

  public getUserInfoOidc$(): Observable<UserInfoOidc> {
    if (!this.userInfoLoaded) {
      this.loadInitialOidcData();
      this.userInfoLoaded = true;
    }
    return this._userInfo.asObservable();
  }

  public getUserId$(): Observable<string> {
    return this.getUserInfoOidc$().pipe(
      map(userInfo => userInfo.sub)
    )
  }

}
