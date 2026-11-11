import { HttpClient } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpClientLocalStorageService } from './cache/http-client-local-storage.service';
import { PersonalNotesService } from './personal-notes.service';

describe('PersonalNotesService delete', () => {
  let service: PersonalNotesService;
  let httpClient: Pick<HttpClient, 'delete'>;
  let localStorageHttp: Pick<
    HttpClientLocalStorageService,
    'invalidateEntryCaches'
  >;

  beforeEach(() => {
    httpClient = { delete: vi.fn() };
    localStorageHttp = { invalidateEntryCaches: vi.fn() };
    service = new PersonalNotesService(
      httpClient as HttpClient,
      localStorageHttp as HttpClientLocalStorageService
    );
  });

  it('invalidates note caches after a successful delete', () => {
    vi.mocked(httpClient.delete).mockReturnValue(of({}));

    service.deleteNoteById('owner', 'note-1').subscribe();

    expect(localStorageHttp.invalidateEntryCaches).toHaveBeenCalledWith('note');
  });

  it('keeps note caches when the delete fails', () => {
    vi.mocked(httpClient.delete).mockReturnValue(
      throwError(() => new Error('delete failed'))
    );

    service.deleteNoteById('owner', 'note-1').subscribe({
      error: () => undefined,
    });

    expect(localStorageHttp.invalidateEntryCaches).not.toHaveBeenCalled();
  });
});
