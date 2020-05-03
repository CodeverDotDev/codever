import { TestBed } from '@angular/core/testing';

import { HowToCodeletComponent } from './how-to-codelet.component';

describe('About Component', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({declarations: [HowToCodeletComponent]});
  });

  it('should ...', () => {
    const fixture = TestBed.createComponent(HowToCodeletComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.children[0].textContent).toContain('Bookmarking for Developers & Co');
  });

});
