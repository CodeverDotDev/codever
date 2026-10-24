import { beforeEach, describe, expect, it } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { HowToBookmarksComponent } from './how-to-bookmarks.component';

describe('About Component', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HowToBookmarksComponent],
      providers: [provideRouter([])],
    });
  });

  it('should ...', () => {
    const fixture = TestBed.createComponent(HowToBookmarksComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.children[0].textContent).toContain(
      'Bookmarks & Notes Manager for Developers'
    );
  });
});
