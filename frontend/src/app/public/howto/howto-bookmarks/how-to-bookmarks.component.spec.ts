import { TestBed } from '@angular/core/testing';

import { HowToBookmarksComponent } from './how-to-bookmarks.component';

describe('About Component', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({declarations: [HowToBookmarksComponent]});
  });

  it('should ...', () => {
    const fixture = TestBed.createComponent(HowToBookmarksComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.children[0].textContent).toContain('Bookmarking for Developers & Co');
  });

});
