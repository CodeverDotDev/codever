import { TestBed } from '@angular/core/testing';

import { HowtoComponent } from './howto.component';

describe('About Component', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ declarations: [HowtoComponent] });
  });

  it('should ...', () => {
    const fixture = TestBed.createComponent(HowtoComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.children[0].textContent).toContain(
      'Collection of (cu)rated coding bookmarks'
    );
  });
});
