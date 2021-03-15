import { TestBed } from '@angular/core/testing';

import { HowToSnippetComponent } from './how-to-snippet.component';

describe('About Component', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({declarations: [HowToSnippetComponent]});
  });

  it('should ...', () => {
    const fixture = TestBed.createComponent(HowToSnippetComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.children[0].textContent).toContain('Bookmarking for Developers & Co');
  });

});
