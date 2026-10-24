import { describe, expect, it } from 'vitest';
import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { MySearchesComponent } from './my-searches.component';
import { UserDataStore } from '../../../core/user/userdata.store';

describe('UserTagsComponent', () => {
  let component: MySearchesComponent;
  let fixture: ComponentFixture<MySearchesComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [MySearchesComponent],
      providers: [
        provideRouter([]),
        {
          provide: UserDataStore,
          useValue: {
            getUserData$: () => of({ searches: [] }),
          },
        },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MySearchesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
