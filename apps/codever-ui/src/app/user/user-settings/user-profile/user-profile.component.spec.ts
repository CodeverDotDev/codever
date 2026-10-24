import { describe, expect, it } from 'vitest';
import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { UserProfileComponent } from './user-profile.component';
import { UserDataStore } from '../../../core/user/userdata.store';
import { UserDataService } from '../../../core/user-data.service';
import { PersonalBookmarksService } from '../../../core/personal-bookmarks.service';

describe('UserPublicProfileEditComponent', () => {
  let component: UserProfileComponent;
  let fixture: ComponentFixture<UserProfileComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [UserProfileComponent],
      providers: [
        { provide: UserDataStore, useValue: {} },
        { provide: UserDataService, useValue: {} },
        { provide: PersonalBookmarksService, useValue: {} },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UserProfileComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput(
      'userData$',
      of({ profile: { displayName: 'Test' } })
    );
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
