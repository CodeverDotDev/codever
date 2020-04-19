import { TestBed } from '@angular/core/testing';

import { BookmarkletComponent } from './bookmarklet.component';

describe('About Component', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({declarations: [BookmarkletComponent]});
  });

  it('should ...', () => {
    const fixture = TestBed.createComponent(BookmarkletComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.children[0].textContent).toContain('Bookmarking for Developers & Co');
  });

});
