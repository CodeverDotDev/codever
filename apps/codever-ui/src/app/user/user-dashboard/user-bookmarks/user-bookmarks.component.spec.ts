import { describe, expect, it } from 'vitest';
import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { UserBookmarksComponent } from './user-bookmarks.component';
import { MyBookmarksStore } from '../../../core/user/my-bookmarks.store';
import { PersonalBookmarksService } from '../../../core/personal-bookmarks.service';
import { UserDataService } from '../../../core/user-data.service';
import { UserInfoStore } from '../../../core/user/user-info.store';
import { UserDataHistoryStore } from '../../../core/user/userdata.history.store';
import { UserDataStore } from '../../../core/user/userdata.store';
import { PaginationNotificationService } from '../../../core/pagination-notification.service';

describe('UserBookmarksComponent', () => {
  let component: UserBookmarksComponent;
  let fixture: ComponentFixture<UserBookmarksComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [UserBookmarksComponent],
      providers: [
        provideRouter([]),
        { provide: MyBookmarksStore, useValue: {} },
        { provide: PersonalBookmarksService, useValue: {} },
        { provide: UserDataService, useValue: {} },
        { provide: UserInfoStore, useValue: {} },
        { provide: UserDataHistoryStore, useValue: {} },
        { provide: UserDataStore, useValue: {} },
        { provide: PaginationNotificationService, useValue: {} },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UserBookmarksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
