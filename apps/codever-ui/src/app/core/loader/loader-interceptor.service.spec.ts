import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed, inject } from '@angular/core/testing';

import { LoaderInterceptorService } from './loader-interceptor.service';
import { LoaderService } from './loader.service';

describe('LoaderInterceptorService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        LoaderInterceptorService,
        { provide: LoaderService, useValue: { show: vi.fn(), hide: vi.fn() } },
      ],
    });
  });

  it('should be created', inject(
    [LoaderInterceptorService],
    (service: LoaderInterceptorService) => {
      expect(service).toBeTruthy();
    }
  ));
});
