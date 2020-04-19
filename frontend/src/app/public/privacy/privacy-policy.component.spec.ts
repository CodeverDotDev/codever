import { TestBed } from '@angular/core/testing';

import { PrivacyComponent } from './howto.component';

describe('About Component', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({declarations: [PrivacyComponent]});
  });

  it('should ...', () => {
    const fixture = TestBed.createComponent(PrivacyComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.children[0].textContent).toContain('Collection of (cu)rated coding bookmarks');
  });

});
