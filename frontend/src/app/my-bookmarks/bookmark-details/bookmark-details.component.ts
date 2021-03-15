import { Component, OnInit } from '@angular/core';
import { Bookmark } from '../../core/model/bookmark';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { UserData } from '../../core/model/user-data';
import { UserInfoStore } from '../../core/user/user-info.store';
import { UserDataStore } from '../../core/user/userdata.store';
import { PersonalBookmarksService } from '../../core/personal-bookmarks.service';

@Component({
  selector: 'app-bookmark-details',
  templateUrl: './bookmark-details.component.html',
  styleUrls: ['./bookmark-details.component.scss']
})
export class BookmarkDetailsComponent implements OnInit {

  bookmark: Bookmark;
  userData$: Observable<UserData>;
  popup: string;

  constructor(
    private route: ActivatedRoute,
    private userInfoStore: UserInfoStore,
    private userDataStore: UserDataStore,
    private personalBookmarksService: PersonalBookmarksService
  ) {
  }

  ngOnInit() {
    this.popup = this.route.snapshot.queryParamMap.get('popup');

    this.userInfoStore.getUserInfo$().subscribe(userInfo => {
      this.userData$ = this.userDataStore.getUserData$();
      this.bookmark = window.history.state.bookmark;
      if (!window.history.state.bookmark) {
        const bookmarkId = this.route.snapshot.paramMap.get('id');
        this.personalBookmarksService.getPersonalBookmarkById(userInfo.sub, bookmarkId).subscribe((response) => {
          this.bookmark = response;
        });
      }
    });

  }

  closeDialog() {
    window.close();
  }

}
