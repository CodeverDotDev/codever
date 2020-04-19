import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UserPublicProfileComponent } from './user-public-profile.component';

describe('UserPublicProfileComponent', () => {
  let component: UserPublicProfileComponent;
  let fixture: ComponentFixture<UserPublicProfileComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UserPublicProfileComponent ]
    })
    .compileComponents();
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
