import { beforeEach, describe, expect, it } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { HowtoComponent } from './howto.component';
import { FeatureToggleService } from '../../core/feature-toggle.service';

describe('About Component', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HowtoComponent],
      providers: [
        provideRouter([]),
        {
          provide: FeatureToggleService,
          useValue: { isMcpServerEnabled: () => of(false) },
        },
      ],
    });
  });

  it('should ...', () => {
    const fixture = TestBed.createComponent(HowtoComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('How to');
  });
});
