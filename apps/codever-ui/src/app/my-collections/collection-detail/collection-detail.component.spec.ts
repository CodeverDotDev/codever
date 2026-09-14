import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';

import { CollectionDetailComponent } from './collection-detail.component';
import { PersonalCollectionsService } from '../../core/personal-collections.service';
import { UserInfoStore } from '../../core/user/user-info.store';
import { MainLinkShortcutService } from '../../core/shortcut/main-link-shortcut.service';
import { UserDataStore } from '../../core/user/userdata.store';
import { UserDataPinnedStore } from '../../core/user/userdata.pinned.store';

/**
 * Template smoke tests: rendering the component (header + one bookmark + one
 * note) must not throw. Catches runtime-only template errors such as a missing
 * pipe (NG0302), which `strictTemplates` and the AOT build do not detect.
 */
describe('CollectionDetailComponent (template smoke)', () => {
  let fixture: ComponentFixture<CollectionDetailComponent>;

  const bookmark = {
    _id: 'b1',
    name: 'Smoke bookmark',
    userId: 'u1',
    public: true,
    location: 'https://example.com',
    tags: ['tag'],
  };
  const note = {
    _id: 'n1',
    title: 'Smoke note',
    userId: 'u1',
    public: false,
    tags: ['tag'],
  };
  const collection = {
    _id: 'c1',
    name: 'Smoke collection',
    userId: 'u1',
    items: [],
    public: false,
    populatedItems: [
      { resourceId: 'b1', resourceType: 'bookmark', resource: bookmark },
      { resourceId: 'n1', resourceType: 'note', resource: note },
    ],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CollectionDetailComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { params: { collectionId: 'c1' } } },
        },
        { provide: Router, useValue: { navigate: () => undefined } },
        {
          provide: PersonalCollectionsService,
          useValue: { getCollectionById: () => of(collection) },
        },
        { provide: UserInfoStore, useValue: { getUserInfoOidc$: () => of({ sub: 'u1' }) } },
        {
          provide: MainLinkShortcutService,
          useValue: {
            openBookmarkInNewTab: () => undefined,
            register: () => undefined,
            unregister: () => undefined,
          },
        },
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

    fixture = TestBed.createComponent(CollectionDetailComponent);
    fixture.detectChanges();
  });

  it('renders the collection header (exercises the `userData$ | async` binding)', () => {
    expect(fixture.nativeElement.querySelector('h3')).not.toBeNull();
  });
});
