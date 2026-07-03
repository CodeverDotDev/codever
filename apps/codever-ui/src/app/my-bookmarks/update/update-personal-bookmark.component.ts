import { Component, OnInit } from '@angular/core';
import { Bookmark } from '../../core/model/bookmark';
import { ActivatedRoute } from '@angular/router';
import { PersonalBookmarksService } from '../../core/personal-bookmarks.service';
import { UserInfoStore } from '../../core/user/user-info.store';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-update-bookmark',
  templateUrl: './update-personal-bookmark.component.html',
  styleUrls: ['./update-personal-bookmark.component.scss'],
})
export class UpdatePersonalBookmarkComponent implements OnInit {
  bookmark$: Observable<Bookmark>;
  bookmarkId: string;
  userId: string;

  constructor(
    private route: ActivatedRoute,
    private personalBookmarksService: PersonalBookmarksService,
    private userInfoStore: UserInfoStore
  ) {}

  ngOnInit(): void {
    // Always load the latest version from the API before editing. Relying on a
    // bookmark passed via router state (e.g. from the pinned / quick-access
    // panel, history or search) could load a stale copy and, on save,
    // overwrite newer changes made elsewhere (a lost update).
    this.bookmark$ = this.userInfoStore.getUserInfoOidc$().pipe(
      switchMap((userInfo) => {
        this.userId = userInfo.sub;
        this.bookmarkId = this.route.snapshot.paramMap.get('id');
        return this.personalBookmarksService.getPersonalBookmarkById(
          this.userId,
          this.bookmarkId
        );
      })
    );
  }
}
