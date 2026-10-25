import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { UserDashboardComponent } from './user-dashboard.component';

describe('UserDashboardComponent', () => {
  let fixture: ComponentFixture<UserDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserDashboardComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(UserDashboardComponent);
    fixture.detectChanges();
  });

  it('groups the destinations into content, search, and community', () => {
    const headings = Array.from(
      fixture.nativeElement.querySelectorAll('h2')
    ).map((heading: HTMLElement) => (heading.textContent ?? '').trim());

    expect(headings).toEqual(['Your content', 'Search', 'Community']);
  });

  it('links to all seven dashboard sections with descriptions', () => {
    const links: HTMLAnchorElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('.dashboard-section-link')
    );

    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/dashboard/bookmarks',
      '/dashboard/notes',
      '/dashboard/tags',
      '/dashboard/searches',
      '/dashboard/following',
      '/dashboard/followers',
      '/dashboard/shared',
    ]);
    expect(
      links.every((link) =>
        (link.querySelector('.text-muted')?.textContent ?? '').trim()
      )
    ).toBe(true);
  });
});
