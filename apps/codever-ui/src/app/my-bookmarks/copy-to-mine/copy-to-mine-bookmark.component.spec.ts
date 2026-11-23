import { afterEach, describe, expect, it, vi } from 'vitest';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom, of, throwError } from 'rxjs';

import { CopyToMineBookmarkComponent } from './copy-to-mine-bookmark.component';
import { PublicBookmarksService } from '../../public/bookmarks/public-bookmarks.service';
import { SharedCopyHandoff } from '../../core/sharing/shared-copy-handoff.service';

const publicBookmark = { _id: 'b1', name: 'Public', location: 'https://a.example' };
const sharedBookmark = { _id: 'b1', type: 'bookmark', name: 'Shared' };

const render = (getPublicBookmarkById: ReturnType<typeof vi.fn>) => {
  TestBed.configureTestingModule({
    imports: [CopyToMineBookmarkComponent],
    providers: [
      provideRouter([]),
      {
        provide: ActivatedRoute,
        useValue: { snapshot: { paramMap: { get: () => 'b1' } } },
      },
      { provide: PublicBookmarksService, useValue: { getPublicBookmarkById } },
    ],
  });
  TestBed.overrideComponent(CopyToMineBookmarkComponent, {
    set: { imports: [RouterLink], schemas: [NO_ERRORS_SCHEMA] },
  });
  return TestBed.inject(SharedCopyHandoff);
};

const create = () => {
  const fixture = TestBed.createComponent(CopyToMineBookmarkComponent);
  fixture.detectChanges();
  return fixture;
};

describe('CopyToMineBookmarkComponent', () => {
  afterEach(() => history.replaceState(null, ''));

  it('uses the bookmark passed by an in-app list', async () => {
    const getPublicBookmarkById = vi.fn();
    render(getPublicBookmarkById);
    history.replaceState({ bookmark: publicBookmark }, '');

    const fixture = create();

    expect(await firstValueFrom(fixture.componentInstance.bookmark$)).toEqual(
      publicBookmark
    );
    expect(getPublicBookmarkById).not.toHaveBeenCalled();
    expect(
      fixture.nativeElement.querySelector('app-save-bookmark-form')
    ).not.toBeNull();
  });

  it('uses the bookmark handed over by a shared page', async () => {
    const getPublicBookmarkById = vi.fn();
    const handoff = render(getPublicBookmarkById);
    handoff.put('bookmark', sharedBookmark);

    const fixture = create();

    expect(await firstValueFrom(fixture.componentInstance.bookmark$)).toBe(
      sharedBookmark
    );
    expect(getPublicBookmarkById).not.toHaveBeenCalled();
  });

  it('loads a public bookmark by id when nothing was handed over', async () => {
    const getPublicBookmarkById = vi.fn().mockReturnValue(of(publicBookmark));
    render(getPublicBookmarkById);

    const fixture = create();

    expect(getPublicBookmarkById).toHaveBeenCalledWith('b1');
    expect(await firstValueFrom(fixture.componentInstance.bookmark$)).toEqual(
      publicBookmark
    );
  });

  it('explains instead of showing an empty form when loading fails', () => {
    const getPublicBookmarkById = vi
      .fn()
      .mockReturnValue(
        throwError(() => new HttpErrorResponse({ status: 404 }))
      );
    render(getPublicBookmarkById);

    const fixture = create();

    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('app-save-bookmark-form')).toBeNull();
    expect(element.querySelector('.copy-unavailable')?.textContent).toContain(
      'open the sharing link again'
    );
  });
});
