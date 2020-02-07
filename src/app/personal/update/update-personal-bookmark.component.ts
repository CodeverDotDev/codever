import { Component, OnInit } from '@angular/core';
import { Bookmark } from '../../core/model/bookmark';
import { ActivatedRoute } from '@angular/router';
import { PersonalBookmarksService } from '../../core/personal-bookmarks.service';
import { map, startWith } from 'rxjs/operators';
import { UserInfoStore } from '../../core/user/user-info.store';
import { Observable, of } from 'rxjs';

@Component({
  selector: 'app-update-bookmark',
  templateUrl: './update-personal-bookmark.component.html',
  styleUrls: ['./update-personal-bookmark.component.scss']
})
export class UpdatePersonalBookmarkComponent implements OnInit {

  bookmark$: Observable<Bookmark>;
  bookmarkId: string;
  userId: string;

  constructor(private route: ActivatedRoute,
              private personalBookmarksService: PersonalBookmarksService,
              private userInfoStore: UserInfoStore) {
    this.userInfoStore.getUserInfo$().subscribe(userInfo => {
      this.userId = userInfo.sub;
    });
  }

  ngOnInit(): void {
    this.bookmark$ = of(window.history.state.bookmark);
    if (!window.history.state.bookmark) {
      this.bookmarkId = this.route.snapshot.paramMap.get('id');
      this.bookmark$ = this.personalBookmarksService.getPersonalBookmarkById(this.userId, this.bookmarkId);
    }
  }
}
