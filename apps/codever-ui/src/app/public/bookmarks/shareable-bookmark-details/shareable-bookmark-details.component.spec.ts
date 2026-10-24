import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { PublicBookmarksService } from '../public-bookmarks.service';
import { ShareableBookmarkDetailsComponent } from './shareable-bookmark-details.component';

describe('ShareableBookmarkDetailsComponent', () => {
  const sharedBookmark = {
    _id: 'bookmark-id',
    type: 'bookmark',
    name: 'Shared bookmark',
    location: 'https://example.com',
    tags: [],
  };

  const makeComponent = (service: Partial<PublicBookmarksService>) =>
    new ShareableBookmarkDetailsComponent(
      {
        paramMap: of(convertToParamMap({ token: 'share-token' })),
      } as unknown as ActivatedRoute,
      service as PublicBookmarksService
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
});
