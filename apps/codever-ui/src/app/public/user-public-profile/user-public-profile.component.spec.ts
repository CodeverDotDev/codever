import { describe, expect, it, vi } from 'vitest';
import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { UserPublicProfileComponent } from './user-public-profile.component';
import { UserPublicService } from './user-public.service';
import { AuthenticationService } from '../../core/auth/authentication.service';
import { PublicBookmarksService } from '../bookmarks/public-bookmarks.service';
import { UserInfoStore } from '../../core/user/user-info.store';
import { UserDataStore } from '../../core/user/userdata.store';
import { UserDataWatchedTagsStore } from '../../core/user/userdata.watched-tags.store';
import { LoginDialogHelperService } from '../../core/login-dialog-helper.service';
import { MatDialog } from '@angular/material/dialog';
import { PaginationNotificationService } from '../../core/pagination-notification.service';
import { NEVER } from 'rxjs';

describe('UserPublicProfileComponent', () => {
  let component: UserPublicProfileComponent;
  let fixture: ComponentFixture<UserPublicProfileComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [UserPublicProfileComponent],
      providers: [
        provideRouter([]),
        {
          provide: UserPublicService,
          useValue: {
            getUserPublicData$: () =>
              of({
                userId: 'test',
                publicProfile: { displayName: 'Test' },
                followers: [],
                topUsedPublicTags: [],
              }),
          },
        },
        { provide: AuthenticationService, useValue: { isLoggedIn: () => false } },
        {
          provide: PublicBookmarksService,
          useValue: { searchPublicBookmarks: () => of([]) },
        },
        { provide: UserInfoStore, useValue: {} },
        { provide: UserDataStore, useValue: {} },
        { provide: UserDataWatchedTagsStore, useValue: {} },
        { provide: LoginDialogHelperService, useValue: {} },
        { provide: MatDialog, useValue: { open: () => ({}) } },
        {
          provide: PaginationNotificationService,
          useValue: {
            pageNavigationClicked$: NEVER,
            clickPageNavigation: vi.fn(),
          },
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UserPublicProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
