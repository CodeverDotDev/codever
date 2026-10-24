import { describe, expect, it } from 'vitest';
import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { FollowingComponent } from './following.component';
import { UserDataService } from '../../../core/user-data.service';

describe('FollowingComponent', () => {
  let component: FollowingComponent;
  let fixture: ComponentFixture<FollowingComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [FollowingComponent],
      providers: [
        provideRouter([]),
        { provide: UserDataService, useValue: { getFollowedUsers$: () => of([]) } },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FollowingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
