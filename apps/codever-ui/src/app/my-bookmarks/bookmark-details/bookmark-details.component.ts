import { Component, OnInit } from '@angular/core';
import { Bookmark } from '../../core/model/bookmark';
import { ActivatedRoute } from '@angular/router';
import { Observable, of } from 'rxjs';
import { UserData } from '../../core/model/user-data';
import { UserInfoStore } from '../../core/user/user-info.store';
import { UserDataStore } from '../../core/user/userdata.store';
import { PersonalBookmarksService } from '../../core/personal-bookmarks.service';

@Component({
  selector: 'app-bookmark-details',
  templateUrl: './bookmark-details.component.html',
  styleUrls: ['./bookmark-details.component.scss'],
})
export class BookmarkDetailsComponent implements OnInit {
  bookmark$: Observable<Bookmark>;
  userData$: Observable<UserData>;
  popup: string;

  constructor(
    private route: ActivatedRoute,
    private userInfoStore: UserInfoStore,
    private userDataStore: UserDataStore,
    private personalBookmarksService: PersonalBookmarksService
  ) {}

  ngOnInit() {
    this.popup = this.route.snapshot.queryParamMap.get('popup');

    this.userInfoStore.getUserInfoOidc$().subscribe((userInfo) => {
      this.userData$ = this.userDataStore.getUserData$();
      if (!window.history.state.bookmark) {
        const bookmarkId = this.route.snapshot.paramMap.get('id');
        this.bookmark$ = this.personalBookmarksService.getPersonalBookmarkById(
          userInfo.sub,
          bookmarkId
        );
      } else {
        this.bookmark$ = of(window.history.state.bookmark);
      }
    });
  }

  closeDialog() {
    window.close();
  }
}
