import { describe, expect, it, vi } from 'vitest';
import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { EMPTY } from 'rxjs';

import { BookmarkDetailsComponent } from './bookmark-details.component';
import { UserInfoStore } from '../../core/user/user-info.store';
import { UserDataStore } from '../../core/user/userdata.store';
import { PersonalBookmarksService } from '../../core/personal-bookmarks.service';
import { AuthenticationService } from '../../core/auth/authentication.service';
import { MainLinkShortcutService } from '../../core/shortcut/main-link-shortcut.service';

describe('BookmarkDetailsComponent', () => {
  let component: BookmarkDetailsComponent;
  let fixture: ComponentFixture<BookmarkDetailsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [BookmarkDetailsComponent],
      providers: [
        provideRouter([]),
        { provide: UserInfoStore, useValue: { getUserInfoOidc$: () => EMPTY } },
        { provide: UserDataStore, useValue: {} },
        { provide: PersonalBookmarksService, useValue: {} },
        { provide: AuthenticationService, useValue: { isLoggedIn: () => false } },
        {
          provide: MainLinkShortcutService,
          useValue: { register: vi.fn(), unregister: vi.fn() },
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BookmarkDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
