import { beforeEach, describe, expect, it } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { PrivacyPolicyComponent } from './privacy-policy.component';

describe('About Component', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [PrivacyPolicyComponent] });
  });

  it('should ...', () => {
    const fixture = TestBed.createComponent(PrivacyPolicyComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.children[0].textContent).toContain(
      'Welcome to our Privacy Policy'
    );
  });
});
