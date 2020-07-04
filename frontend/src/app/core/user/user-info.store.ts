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

  constructor(private userService: UserDataService,
              private logger: Logger,
              private errorService: ErrorService,
              private userInfoService: UserInfoService,
  ) {
  }

  private loadInitialData() {
    this.userInfoService.getUserInfo().subscribe(data => {
        this._userInfo.next(data);
      }
    );
  }

  public getUserInfo$(): Observable<UserInfoOidc> {
    if (!this.userInfoLoaded) {
      this.loadInitialData();
      this.userInfoLoaded = true;
    }
    return this._userInfo.asObservable();
  }

}
