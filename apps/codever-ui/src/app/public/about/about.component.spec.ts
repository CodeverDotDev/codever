import { beforeEach, describe, expect, it } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AboutComponent } from './about.component';

describe('About Component', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AboutComponent],
      providers: [provideRouter([])],
    });
  });

  it('should ...', () => {
    const fixture = TestBed.createComponent(AboutComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.children[0].textContent).toContain(
      'Bookmarking for Developers & Co'
    );
  });
});
