import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { UserDataService } from '../../core/user-data.service';
import { UserInfoStore } from '../../core/user/user-info.store';
import { UserDataStore } from '../../core/user/userdata.store';
import { DashboardSectionPageComponent } from './dashboard-section-page.component';
import { userDashboardRoutes } from './user-dashboard.module';

describe('DashboardSectionPageComponent', () => {
  const sections = [
    'bookmarks',
    'notes',
    'tags',
    'searches',
    'following',
    'followers',
    'shared',
  ];

  it.each(sections)('routes %s to the section page', (section) => {
    const route = userDashboardRoutes.find(
      (candidate) => candidate.path === section
    );

    expect(route?.component).toBe(DashboardSectionPageComponent);
    expect(route?.data?.['section']).toBe(section);
    expect(route?.canActivate).toBeDefined();
  });

  describe('section rendering', () => {
    let fixture: ComponentFixture<DashboardSectionPageComponent>;

    beforeEach(async () => {
      TestBed.configureTestingModule({
        imports: [DashboardSectionPageComponent],
        providers: [
          provideRouter([]),
          {
            provide: ActivatedRoute,
            useValue: { snapshot: { data: { section: 'following' } } },
          },
          {
            provide: UserInfoStore,
            useValue: { getUserInfoOidc$: () => of({ sub: 'owner' }) },
          },
          { provide: UserDataStore, useValue: { getUserData$: () => of({}) } },
          {
            provide: UserDataService,
            useValue: { getFollowedUsers$: () => of([]) },
          },
        ],
      });

      fixture = TestBed.createComponent(DashboardSectionPageComponent);
      fixture.detectChanges();
    });

    it('renders the selected existing section with the signed-in user', () => {
      expect(
        fixture.nativeElement.querySelector('app-following')
      ).not.toBeNull();
      expect(fixture.componentInstance.userId).toBe('owner');
    });

    it('shows the section title beside the dashboard back link', () => {
      const heading = fixture.nativeElement.querySelector('h1');

      expect(heading.textContent.trim()).toBe('Following');
    });

    it('links back to the dashboard overview', () => {
      const backLink = fixture.nativeElement.querySelector(
        'a[aria-label="Back to Dashboard"]'
      );

      expect(backLink.getAttribute('href')).toBe('/dashboard');
      expect(
        backLink.querySelector('i')?.classList.contains('fa-arrow-left')
      ).toBe(true);
    });
  });

  describe('section headings', () => {
    it.each([
      ['bookmarks', 'My bookmarks'],
      ['notes', 'My notes'],
      ['tags', 'My tags'],
      ['searches', 'Saved searches'],
      ['following', 'Following'],
      ['followers', 'Followers'],
      ['shared', 'Shared by me'],
    ] as const)(
      'shows visible heading "%s" beside the back link for %s',
      (section, title) => {
        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
          imports: [DashboardSectionPageComponent],
          providers: [
            provideRouter([]),
            {
              provide: ActivatedRoute,
              useValue: { snapshot: { data: { section } } },
            },
            {
              provide: UserInfoStore,
              useValue: { getUserInfoOidc$: () => of() },
            },
            {
              provide: UserDataStore,
              useValue: { getUserData$: () => of({}) },
            },
          ],
        });

        const fixture = TestBed.createComponent(DashboardSectionPageComponent);
        fixture.detectChanges();

        const heading = fixture.nativeElement.querySelector('h1');
        expect(heading.textContent.trim()).toBe(title);

        const backLink = fixture.nativeElement.querySelector(
          'a[aria-label="Back to Dashboard"]'
        );
        expect(backLink).not.toBeNull();
        expect(backLink.getAttribute('href')).toBe('/dashboard');
      }
    );
  });
});

