import { Component, Input, OnInit } from '@angular/core';
import { UserData } from '../../../core/model/user-data';
import { UserDataStore } from '../../../core/user/userdata.store';
import { Observable } from 'rxjs';
import {
  MatRadioChange,
  MatRadioGroup,
  MatRadioButton,
} from '@angular/material/radio';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-user-feed-setup',
  templateUrl: './user-feed.component.html',
  styleUrls: ['./user-feed.component.scss'],
  imports: [MatRadioGroup, FormsModule, MatRadioButton, RouterLink, AsyncPipe],
})
export class UserFeedComponent implements OnInit {
  feedTopic: string;

  @Input()
  userData$: Observable<UserData>;
  private userData: UserData;

  constructor(private userDataStore: UserDataStore) {}

  ngOnInit() {
    this.userData$.subscribe((userData) => {
      this.userData = userData;
      if (this.userData.showAllPublicInFeed) {
        this.feedTopic = 'all-public';
      } else {
        this.feedTopic = 'my-watched-tags';
      }
    });
  }

  selectionChange($event: MatRadioChange) {
    this.userDataStore
      .updateFeedToggleOption$($event.value === 'all-public')
      .subscribe();
  }
}
