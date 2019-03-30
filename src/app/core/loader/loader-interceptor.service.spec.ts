import { TestBed, inject } from '@angular/core/testing';

import { LoaderInterceptorService } from './loader-interceptor.service';

describe('LoaderInterceptorService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LoaderInterceptorService]
    });
  });

  it('should be created', inject([LoaderInterceptorService], (service: LoaderInterceptorService) => {
    expect(service).toBeTruthy();
  }));
});
