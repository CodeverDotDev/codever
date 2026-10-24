import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import {
  provideHttpClient,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { ShareLinksService } from './share-links.service';
import { environment } from '../../environments/environment';

describe('ShareLinksService', () => {
  let service: ShareLinksService;
  let httpTestingController: HttpTestingController;
  let setItemSpy: ReturnType<typeof vi.spyOn>;
  const baseUrl = `${environment.API_URL}/personal/users/owner/share-links`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ShareLinksService);
    httpTestingController = TestBed.inject(HttpTestingController);
    setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
  });

  afterEach(() => {
    httpTestingController.verify();
    setItemSpy.mockRestore();
  });

  it('fetches fresh status through HttpClient', () => {
    service.getStatus('owner', 'bookmark', 'resource-id').subscribe();

    const request = httpTestingController.expectOne(
      `${baseUrl}/bookmark/resource-id`
    );
    expect(request.request.method).toBe('GET');
    request.flush({ active: false });
    expect(setItemSpy).not.toHaveBeenCalled();
  });

  it('creates only on the explicit create call', () => {
    service.create('owner', 'note', 'resource-id').subscribe();

    const request = httpTestingController.expectOne(`${baseUrl}/note/resource-id`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({});
    request.flush({ active: true });
  });

  it('lists with the requested page and limit and revokes by link ID', () => {
    service.list('owner', 2, 20).subscribe();
    const listRequest = httpTestingController.expectOne(
      (request) =>
        request.url === baseUrl &&
        request.params.get('page') === '2' &&
        request.params.get('limit') === '20'
    );
    expect(listRequest.request.method).toBe('GET');
    listRequest.flush({ items: [], page: 2, limit: 20, total: 0 });

    service.revoke('owner', 'link-id').subscribe();
    const revokeRequest = httpTestingController.expectOne(`${baseUrl}/link-id`);
    expect(revokeRequest.request.method).toBe('DELETE');
    revokeRequest.flush(null);
    expect(setItemSpy).not.toHaveBeenCalled();
  });
});
