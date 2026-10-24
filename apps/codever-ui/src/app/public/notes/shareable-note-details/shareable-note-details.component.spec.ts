import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { PublicNotesService } from '../public-notes.service';
import { ShareableNoteDetailsComponent } from './shareable-note-details.component';

describe('ShareableNoteDetailsComponent', () => {
  const sharedNote = {
    _id: 'note-id',
    type: 'note',
    title: 'Shared note',
    content: 'Shared content',
    contentType: 'markdown',
    tags: [],
  };

  const makeComponent = (service: Partial<PublicNotesService>) =>
    new ShareableNoteDetailsComponent(
      {
        paramMap: of(convertToParamMap({ token: 'share-token' })),
      } as unknown as ActivatedRoute,
      service as PublicNotesService
    );

  it('shows unavailable for a revoked token', () => {
    const component = makeComponent({
      getSharedNoteByToken: vi
        .fn()
        .mockReturnValue(
          throwError(
            () => new HttpErrorResponse({ status: 404, statusText: 'Not Found' })
          )
        ),
    });
    component.ngOnInit();
    component.note$.subscribe();

    expect(component.loadState).toBe('unavailable');
  });

  it('keeps transient errors retryable and loads the shared note', () => {
    const getSharedNoteByToken = vi
      .fn()
      .mockReturnValueOnce(throwError(() => new Error('offline')))
      .mockReturnValueOnce(of(sharedNote));
    const component = makeComponent({ getSharedNoteByToken });
    component.ngOnInit();
    component.note$.subscribe();

    expect(component.loadState).toBe('error');
    component.retry();

    expect(component.loadState).toBe('loaded');
    expect(getSharedNoteByToken).toHaveBeenCalledTimes(2);
  });
});
