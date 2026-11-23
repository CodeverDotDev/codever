import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { PublicNotesService } from '../public-notes.service';
import { ShareableNoteDetailsComponent } from './shareable-note-details.component';
import { SharedCopyFlow } from '../../../shared/shared-copy/shared-copy-flow.service';

describe('ShareableNoteDetailsComponent', () => {
  const sharedNote = {
    _id: 'note-id',
    type: 'note',
    title: 'Shared note',
    content: 'Shared content',
    contentType: 'markdown',
    tags: [],
  };

  const makeComponent = (
    service: Partial<PublicNotesService>,
    flow: Partial<SharedCopyFlow> = {
      takeCopyRequest: () => false,
      start: vi.fn(),
    }
  ) =>
    new ShareableNoteDetailsComponent(
      {
        paramMap: of(convertToParamMap({ token: 'share-token' })),
      } as unknown as ActivatedRoute,
      service as PublicNotesService,
      flow as SharedCopyFlow
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

  it('starts the copy flow for the shared note', () => {
    const start = vi.fn();
    const component = makeComponent(
      { getSharedNoteByToken: vi.fn().mockReturnValue(of(sharedNote)) },
      { takeCopyRequest: () => false, start }
    );
    component.ngOnInit();
    component.note$.subscribe();

    component.copyToMine(sharedNote as never);

    expect(start).toHaveBeenCalledWith('note', sharedNote);
  });

  it('opens the copy flow once after returning from a login', () => {
    const start = vi.fn();
    const getSharedNoteByToken = vi.fn().mockReturnValue(of(sharedNote));
    const component = makeComponent(
      { getSharedNoteByToken },
      { takeCopyRequest: () => true, start }
    );
    component.ngOnInit();
    component.note$.subscribe();
    component.retry();

    expect(start).toHaveBeenCalledTimes(1);
    expect(start).toHaveBeenCalledWith('note', sharedNote);
  });

  it('does not open the copy flow without a copy request', () => {
    const start = vi.fn();
    const component = makeComponent(
      { getSharedNoteByToken: vi.fn().mockReturnValue(of(sharedNote)) },
      { takeCopyRequest: () => false, start }
    );
    component.ngOnInit();
    component.note$.subscribe();

    expect(start).not.toHaveBeenCalled();
  });
});
