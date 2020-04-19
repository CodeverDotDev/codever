import { TestBed, inject } from '@angular/core/testing';

import { LoaderService } from './loader.service';

describe('LoaderService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [LoaderService]
    });
  });

  it('should be created', inject([LoaderService], (service: LoaderService) => {
    expect(service).toBeTruthy();
  }));
});
