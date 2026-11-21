import { describe, expect, it, vi } from 'vitest';
import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';

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
  let dialogResult: unknown;
  let userDataStore: { updateUserDataHistoryBulk$: ReturnType<typeof vi.fn> };
  let myBookmarksStore: { addToLastCreatedBulk: ReturnType<typeof vi.fn> };

  beforeEach(waitForAsync(() => {
    dialogResult = undefined;
    userDataStore = { updateUserDataHistoryBulk$: vi.fn() };
    myBookmarksStore = { addToLastCreatedBulk: vi.fn() };
    TestBed.configureTestingModule({
      imports: [UserBookmarksComponent],
      providers: [
        provideRouter([]),
        { provide: MyBookmarksStore, useValue: myBookmarksStore },
        { provide: PersonalBookmarksService, useValue: {} },
        { provide: UserDataService, useValue: {} },
        { provide: UserInfoStore, useValue: {} },
        { provide: UserDataHistoryStore, useValue: {} },
        { provide: UserDataStore, useValue: userDataStore },
        {
          provide: MatDialog,
          useValue: {
            open: () => ({ afterClosed: () => of(dialogResult) }),
          },
        },
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

  it.each([
    ['without a result', undefined],
    ['with nothing created', { created: [], duplicatesSize: 3 }],
  ])('closing the import dialog %s changes nothing', (_, result) => {
    dialogResult = result;

    expect(() => component.importBookmarks()).not.toThrow();
    expect(userDataStore.updateUserDataHistoryBulk$).not.toHaveBeenCalled();
    expect(myBookmarksStore.addToLastCreatedBulk).not.toHaveBeenCalled();
  });

  it('adds imported bookmarks to history and last created', () => {
    const older = { name: 'old', createdAt: '2021-01-01T00:00:00.000Z' };
    const newer = { name: 'new', createdAt: '2024-01-01T00:00:00.000Z' };
    dialogResult = { created: [older, newer] };

    component.importBookmarks();

    expect(userDataStore.updateUserDataHistoryBulk$).toHaveBeenCalledWith([
      newer,
      older,
    ]);
    expect(myBookmarksStore.addToLastCreatedBulk).toHaveBeenCalledWith([
      newer,
      older,
    ]);
  });
});
