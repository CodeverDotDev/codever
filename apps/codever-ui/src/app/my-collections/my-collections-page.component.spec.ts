import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';

import { MyCollectionsPageComponent } from './my-collections-page.component';
import { PersonalCollectionsService } from '../core/personal-collections.service';
import { UserInfoStore } from '../core/user/user-info.store';
import { UserDataStore } from '../core/user/userdata.store';
import { UserDataPinnedStore } from '../core/user/userdata.pinned.store';

/**
 * Template smoke tests: rendering the component must not throw. This catches
 * runtime-only template errors (e.g. NG0302 "The pipe 'async' could not be
 * found") that `strictTemplates` and the AOT build do not detect.
 */
describe('MyCollectionsPageComponent (template smoke)', () => {
  let fixture: ComponentFixture<MyCollectionsPageComponent>;

  const collection = {
    _id: 'c1',
    name: 'Smoke collection',
    userId: 'u1',
    items: [],
    public: false,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyCollectionsPageComponent],
      providers: [
        {
          provide: PersonalCollectionsService,
          useValue: { getUserCollections: () => of([collection]) },
        },
        {
          provide: UserInfoStore,
          useValue: {
            getUserInfoOidc$: () => of({ sub: 'u1' }),
            getUserId$: () => of('u1'),
          },
        },
        {
          provide: MatDialog,
          useValue: { open: () => ({ afterClosed: () => of(null) }) },
        },
        { provide: Router, useValue: { navigate: () => undefined } },
        {
          provide: UserDataStore,
          useValue: { getUserData$: () => of({ pinned: [] }) },
        },
        {
          provide: UserDataPinnedStore,
          useValue: {
            addCollectionToPinned: () => undefined,
            removeCollectionFromPinned: () => undefined,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MyCollectionsPageComponent);
    fixture.detectChanges();
  });

  it('renders a collection card (exercises the `userData$ | async` binding)', () => {
    expect(
      fixture.nativeElement.querySelector('.collection-card')
    ).not.toBeNull();
  });
});
