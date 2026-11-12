import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { ReplaySubject, Subject, of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthenticationService } from '../../core/auth/authentication.service';
import { ErrorService } from '../../core/error/error.service';
import { HomeTab } from '../../core/home-tabs/home-tabs';
import { UserData } from '../../core/model/user-data';
import { UserDataStore } from '../../core/user/userdata.store';
import { HomeTabsComponent } from './home-tabs.component';

describe('HomeTabsComponent tab ordering', () => {
  let userData$: ReplaySubject<UserData>;
  let userDataStore: {
    getUserData$: ReturnType<typeof vi.fn>;
    updateHomeTabs$: ReturnType<typeof vi.fn>;
  };
  let errorService: { handleError: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    userData$ = new ReplaySubject<UserData>(1);
    userData$.next({ userId: 'owner' });
    userDataStore = {
      getUserData$: vi.fn(() => userData$.asObservable()),
      updateHomeTabs$: vi.fn(),
    };
    errorService = { handleError: vi.fn() };

    TestBed.configureTestingModule({
      imports: [HomeTabsComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthenticationService,
          useValue: { isLoggedIn: () => true },
        },
        { provide: UserDataStore, useValue: userDataStore },
        { provide: ErrorService, useValue: errorService },
      ],
    });
  });

  it('disables native link dragging for signed-in users', () => {
    const fixture = TestBed.createComponent(HomeTabsComponent);
    fixture.detectChanges();

    const links: HTMLAnchorElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('a.home-tab-link')
    );
    expect(links.length).toBe(4);
    links.forEach((link) => expect(link.getAttribute('draggable')).toBe('false'));
    fixture.destroy();
  });

  it('reorders tabs and persists the new order', () => {
    userDataStore.updateHomeTabs$.mockReturnValue(
      of({ homeTabs: ['pinned', 'feed', 'history', 'read-later'] })
    );
    const fixture = TestBed.createComponent(HomeTabsComponent);
    const component = fixture.componentInstance;

    component.drop({ previousIndex: 2, currentIndex: 0 } as CdkDragDrop<
      HomeTab[]
    >);

    expect(component.tabs.map((tab) => tab.id)).toEqual([
      'pinned',
      'feed',
      'history',
      'read-later',
    ]);
    expect(userDataStore.updateHomeTabs$).toHaveBeenCalledWith([
      'pinned',
      'feed',
      'history',
      'read-later',
    ]);
    expect(component.saving).toBe(false);
    fixture.destroy();
  });

  it('accepts drops while saving and persists only the latest order next', () => {
    const firstSave = new Subject<UserData>();
    userDataStore.updateHomeTabs$
      .mockReturnValueOnce(firstSave.asObservable())
      .mockReturnValueOnce(of({ userId: 'owner' }));
    const fixture = TestBed.createComponent(HomeTabsComponent);
    const component = fixture.componentInstance;

    component.drop({ previousIndex: 2, currentIndex: 0 } as CdkDragDrop<
      HomeTab[]
    >);
    component.drop({ previousIndex: 3, currentIndex: 1 } as CdkDragDrop<
      HomeTab[]
    >);

    expect(component.tabs.map((tab) => tab.id)).toEqual([
      'pinned',
      'read-later',
      'feed',
      'history',
    ]);
    expect(userDataStore.updateHomeTabs$).toHaveBeenCalledTimes(1);

    firstSave.next({ userId: 'owner' });
    firstSave.complete();

    expect(userDataStore.updateHomeTabs$).toHaveBeenCalledTimes(2);
    expect(userDataStore.updateHomeTabs$).toHaveBeenLastCalledWith([
      'pinned',
      'read-later',
      'feed',
      'history',
    ]);
    expect(component.saving).toBe(false);
    fixture.destroy();
  });

  it('restores the previous order and notifies when saving fails', () => {
    userDataStore.updateHomeTabs$.mockReturnValue(
      throwError(() => new Error('failed'))
    );
    const fixture = TestBed.createComponent(HomeTabsComponent);
    const component = fixture.componentInstance;

    component.drop({ previousIndex: 2, currentIndex: 0 } as CdkDragDrop<
      HomeTab[]
    >);

    expect(component.tabs.map((tab) => tab.id)).toEqual([
      'feed',
      'history',
      'pinned',
      'read-later',
    ]);
    expect(errorService.handleError).toHaveBeenCalledWith({
      title: 'Unable to save tab order',
      messages: ['Please try again.'],
    });
    expect(component.saving).toBe(false);
    fixture.destroy();
  });
});
