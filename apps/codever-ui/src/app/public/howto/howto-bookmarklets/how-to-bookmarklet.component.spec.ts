import { TestBed } from '@angular/core/testing';

import { HowToBookmarkletComponent } from './how-to-bookmarklet.component';

describe('About Component', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [HowToBookmarkletComponent],
    });
  });

  it('should ...', () => {
    const fixture = TestBed.createComponent(HowToBookmarkletComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.children[0].textContent).toContain(
      'Bookmarking for Developers & Co'
    );
  });
});
