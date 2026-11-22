import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { AdminService } from './admin.service';
import { environment } from '../../../environments/environment';

describe('AdminService', () => {
  let service: AdminService;
  let http: HttpTestingController;
  let setItemSpy: ReturnType<typeof vi.spyOn>;
  const baseUrl = `${environment.API_URL}/admin`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AdminService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AdminService);
    http = TestBed.inject(HttpTestingController);
    setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
  });

  afterEach(() => {
    http.verify();
    // admin data is never cached in the browser
    expect(setItemSpy).not.toHaveBeenCalled();
    setItemSpy.mockRestore();
  });

  it('loads the overview', () => {
    service.getOverview().subscribe();

    const request = http.expectOne(`${baseUrl}/overview`);
    expect(request.request.method).toBe('GET');
    request.flush({});
  });

  it('loads public entries and leaves out empty filters', () => {
    service
      .getPublicEntries({ q: 'casino', type: 'all', userId: '', page: 2, limit: 20 })
      .subscribe();

    const request = http.expectOne((req) =>
      req.url.endsWith('/admin/public-entries')
    );
    expect(request.request.params.get('q')).toBe('casino');
    expect(request.request.params.get('type')).toBe('all');
    expect(request.request.params.has('userId')).toBe(false);
    expect(request.request.params.get('page')).toBe('2');
    expect(request.request.params.get('limit')).toBe('20');
    request.flush([]);
  });

  it('unpublishes and deletes bookmarks and notes on their own paths', () => {
    service.unpublishEntry({ type: 'note', id: 'n1' }).subscribe();
    service.deleteEntry({ type: 'bookmark', id: 'b1' }).subscribe();

    const unpublish = http.expectOne(`${baseUrl}/notes/n1/unpublish`);
    expect(unpublish.request.method).toBe('PATCH');
    unpublish.flush({ type: 'note', id: 'n1' });
    const remove = http.expectOne(`${baseUrl}/bookmarks/b1`);
    expect(remove.request.method).toBe('DELETE');
    remove.flush(null);
  });

  it('sends only type and id in a bulk request', () => {
    service
      .bulkModerate('delete', [
        { type: 'bookmark', id: 'b1', title: 'x' } as never,
      ])
      .subscribe();

    const request = http.expectOne(`${baseUrl}/moderation/bulk`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      action: 'delete',
      entries: [{ type: 'bookmark', id: 'b1' }],
    });
    request.flush({ succeeded: [], failed: [] });
  });

  it('loads the audit log and restores a delete', () => {
    service
      .getAuditLog({ action: 'delete', type: undefined, page: 1, limit: 25 })
      .subscribe();
    service.restoreDeletedEntry('a1').subscribe();

    const log = http.expectOne((req) => req.url.endsWith('/admin/audit-log'));
    expect(log.request.params.get('action')).toBe('delete');
    expect(log.request.params.has('type')).toBe(false);
    log.flush([]);
    const restore = http.expectOne(`${baseUrl}/audit-log/a1/restore`);
    expect(restore.request.method).toBe('POST');
    restore.flush({});
  });
});
