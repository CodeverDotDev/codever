import { Component, OnInit } from '@angular/core';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { UserData } from '../core/model/user-data';
import { UserInfoStore } from '../core/user/user-info.store';
import { UserDataStore } from '../core/user/userdata.store';

@Component({
  selector: 'app-user-settings',
  templateUrl: './user-settings.component.html',
  styleUrls: ['./user-settings.component.scss']
})
export class UserSettingsComponent implements OnInit {

  environment = environment;
  userData$: Observable<UserData>;

  constructor(private userInfoStore: UserInfoStore,
              private userDataStore: UserDataStore) { }

  ngOnInit() {
    this.userInfoStore.getUserInfo$().subscribe(userInfo => {
      this.userData$ = this.userDataStore.getUserData$();
    });
  }

}
