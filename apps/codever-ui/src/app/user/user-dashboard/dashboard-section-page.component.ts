import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { UserData } from '../../core/model/user-data';
import { UserInfoStore } from '../../core/user/user-info.store';
import { UserDataStore } from '../../core/user/userdata.store';
import { UserBookmarksComponent } from './user-bookmarks/user-bookmarks.component';
import { MyNotesComponent } from './my-notes/my-notes.component';
import { UserTagsComponent } from './tags/user-tags.component';
import { MySearchesComponent } from './my-searches/my-searches.component';
import { FollowingComponent } from './following/following.component';
import { FollowersComponent } from './followers/followers.component';
import { SharedByMeComponent } from './shared-by-me/shared-by-me.component';

const dashboardSections = [
  'bookmarks',
  'notes',
  'tags',
  'searches',
  'following',
  'followers',
  'shared',
] as const;

type DashboardSection = (typeof dashboardSections)[number];

const dashboardSectionTitles: Record<DashboardSection, string> = {
  bookmarks: 'My bookmarks',
  notes: 'My notes',
  tags: 'My tags',
  searches: 'Saved searches',
  following: 'Following',
  followers: 'Followers',
  shared: 'Shared by me',
};

function isDashboardSection(value: unknown): value is DashboardSection {
  return dashboardSections.some((section) => section === value);
}

@Component({
  selector: 'app-dashboard-section-page',
  templateUrl: './dashboard-section-page.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    RouterLink,
    UserBookmarksComponent,
    MyNotesComponent,
    UserTagsComponent,
    MySearchesComponent,
    FollowingComponent,
    FollowersComponent,
    SharedByMeComponent,
  ],
})
export class DashboardSectionPageComponent implements OnInit {
  readonly section: DashboardSection;
  readonly sectionTitle: string;
  userId: string;
  userData$: Observable<UserData>;

  constructor(
    route: ActivatedRoute,
    private userInfoStore: UserInfoStore,
    private userDataStore: UserDataStore
  ) {
    const section = route.snapshot.data['section'];
    if (!isDashboardSection(section)) {
      throw new Error('Dashboard route has an invalid section.');
    }
    this.section = section;
    this.sectionTitle = dashboardSectionTitles[section];
  }

  ngOnInit(): void {
    this.userInfoStore.getUserInfoOidc$().subscribe((userInfo) => {
      this.userId = userInfo.sub;
      this.userData$ = this.userDataStore.getUserData$();
    });
  }
}
