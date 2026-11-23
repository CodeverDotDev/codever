import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AsyncPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { PublicBookmarksService } from '../public-bookmarks.service';
import { ShareableBookmarkDetailsComponent } from './shareable-bookmark-details.component';
import { SharedCopyFlow } from '../../../shared/shared-copy/shared-copy-flow.service';

describe('ShareableBookmarkDetailsComponent', () => {
  const sharedBookmark = {
    _id: 'bookmark-id',
    type: 'bookmark',
    name: 'Shared bookmark',
    location: 'https://example.com',
    tags: [],
  };

  const route = {
    paramMap: of(convertToParamMap({ token: 'share-token' })),
  } as unknown as ActivatedRoute;

  const makeComponent = (
    service: Partial<PublicBookmarksService>,
    flow: Partial<SharedCopyFlow> = {
      takeCopyRequest: () => false,
      start: vi.fn(),
    }
  ) =>
    new ShareableBookmarkDetailsComponent(
      route,
      service as PublicBookmarksService,
      flow as SharedCopyFlow
    );

  it('shows unavailable for a revoked token', () => {
    const unavailable = makeComponent({
      getSharedBookmarkByToken: vi.fn().mockReturnValue(
        throwError(
          () => new HttpErrorResponse({ status: 404, statusText: 'Not Found' })
        )
      ),
    });
    unavailable.ngOnInit();
    unavailable.bookmark$.subscribe();
    expect(unavailable.loadState).toBe('unavailable');
  });

  it('retries transient failures and renders the current shared resource', () => {
    const getSharedBookmarkByToken = vi
      .fn()
      .mockReturnValueOnce(throwError(() => new Error('offline')))
      .mockReturnValueOnce(of(sharedBookmark));
    const component = makeComponent({ getSharedBookmarkByToken });
    component.ngOnInit();
    component.bookmark$.subscribe();

    expect(component.loadState).toBe('error');
    component.retry();

    expect(getSharedBookmarkByToken).toHaveBeenCalledTimes(2);
    expect(component.loadState).toBe('loaded');
  });

  it('opens the copy flow once after returning from a login', () => {
    const start = vi.fn();
    const component = makeComponent(
      {
        getSharedBookmarkByToken: vi.fn().mockReturnValue(of(sharedBookmark)),
      },
      { takeCopyRequest: () => true, start }
    );
    component.ngOnInit();
    component.bookmark$.subscribe();
    component.retry();

    expect(start).toHaveBeenCalledTimes(1);
    expect(start).toHaveBeenCalledWith('bookmark', sharedBookmark);
  });

  it('shows Copy to mine and starts the copy flow on click', () => {
    const start = vi.fn();
    TestBed.configureTestingModule({
      imports: [ShareableBookmarkDetailsComponent],
      providers: [
        { provide: ActivatedRoute, useValue: route },
        {
          provide: PublicBookmarksService,
          useValue: {
            getSharedBookmarkByToken: () => of(sharedBookmark),
          },
        },
        {
          provide: SharedCopyFlow,
          useValue: { takeCopyRequest: () => false, start },
        },
      ],
    });
    TestBed.overrideComponent(ShareableBookmarkDetailsComponent, {
      set: { imports: [AsyncPipe, DatePipe], schemas: [NO_ERRORS_SCHEMA] },
    });
    const fixture = TestBed.createComponent(ShareableBookmarkDetailsComponent);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector(
      'button.shared-copy-to-mine'
    );
    expect(button.textContent).toContain('Copy to mine');
    expect(fixture.nativeElement.querySelectorAll('button').length).toBe(1);

    button.click();
    expect(start).toHaveBeenCalledWith('bookmark', sharedBookmark);
  });
});
