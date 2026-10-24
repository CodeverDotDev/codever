import { describe, expect, it } from 'vitest';
import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { UserTagsComponent } from './user-tags.component';
import { UserDataService } from '../../../core/user-data.service';
import { UserDataWatchedTagsStore } from '../../../core/user/userdata.watched-tags.store';
import { PersonalBookmarksService } from '../../../core/personal-bookmarks.service';
import { LocalStorageService } from '../../../core/cache/local-storage.service';

describe('UserTagsComponent', () => {
  let component: UserTagsComponent;
  let fixture: ComponentFixture<UserTagsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [UserTagsComponent],
      providers: [
        provideRouter([]),
        {
          provide: UserDataService,
          useValue: { getUsedTags: () => of({ private: [], public: [] }) },
        },
        { provide: UserDataWatchedTagsStore, useValue: {} },
        { provide: PersonalBookmarksService, useValue: {} },
        { provide: LocalStorageService, useValue: {} },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UserTagsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
