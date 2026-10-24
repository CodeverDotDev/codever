import { describe, expect, it } from 'vitest';
import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { UserFeedComponent } from './user-feed.component';
import { UserDataStore } from '../../../core/user/userdata.store';

describe('UserPublicProfileEditComponent', () => {
  let component: UserFeedComponent;
  let fixture: ComponentFixture<UserFeedComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [UserFeedComponent],
      providers: [provideRouter([]), { provide: UserDataStore, useValue: {} }],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UserFeedComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput(
      'userData$',
      of({ showAllPublicInFeed: false })
    );
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
