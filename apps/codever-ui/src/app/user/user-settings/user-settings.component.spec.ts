import { describe, expect, it } from 'vitest';
import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { UserSettingsComponent } from './user-settings.component';
import { UserInfoStore } from '../../core/user/user-info.store';
import { UserDataStore } from '../../core/user/userdata.store';
import { UserDataService } from '../../core/user-data.service';
import { LocalStorageService } from '../../core/cache/local-storage.service';
import { PersonalBookmarksService } from '../../core/personal-bookmarks.service';

describe('UserSettingsComponent', () => {
  let component: UserSettingsComponent;
  let fixture: ComponentFixture<UserSettingsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [UserSettingsComponent],
      providers: [
        { provide: UserInfoStore, useValue: { getUserInfoOidc$: () => of({}) } },
        {
          provide: UserDataStore,
          useValue: {
            getUserData$: () =>
              of({ userId: 'test', profile: { displayName: 'Test' } }),
          },
        },
        { provide: UserDataService, useValue: {} },
        { provide: LocalStorageService, useValue: {} },
        { provide: PersonalBookmarksService, useValue: {} },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UserSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
