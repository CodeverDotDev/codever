import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';

import { ExportBookmarksDialogComponent } from './export-bookmarks-dialog.component';
import { PersonalBookmarksService } from '../../../core/personal-bookmarks.service';
import { PersonalCollectionsService } from '../../../core/personal-collections.service';
import { Bookmark } from '../../../core/model/bookmark';
import { Collection } from '../../../core/model/collection';

function bookmark(id: string, tags: string[], location?: string): Bookmark {
  return {
    _id: id,
    name: `Bookmark ${id}`,
    location: location || `https://example.com/${id}`,
    type: 'bookmark',
    tags,
    createdAt: new Date(Date.UTC(2026, 0, Number(id))),
  };
}

describe('ExportBookmarksDialogComponent', () => {
  let fixture: ComponentFixture<ExportBookmarksDialogComponent>;
  let component: ExportBookmarksDialogComponent;
  let bookmarks: Bookmark[];
  let collections: Collection[];
  let bookmarksService: { getAllMyBookmarks: ReturnType<typeof vi.fn> };
  let collectionsService: { getAllUserCollections: ReturnType<typeof vi.fn> };
  let createdBlobs: Blob[];
  let downloadedNames: string[];

  beforeEach(async () => {
    bookmarks = [bookmark('1', ['java', 'spring']), bookmark('2', ['java'])];
    collections = [
      {
        name: 'Reading list',
        userId: 'u1',
        public: false,
        items: [{ resourceId: '2', resourceType: 'bookmark' }],
      },
    ];
    bookmarksService = {
      getAllMyBookmarks: vi.fn(() => of(bookmarks)),
    };
    collectionsService = {
      getAllUserCollections: vi.fn(() => of(collections)),
    };

    createdBlobs = [];
    downloadedNames = [];
    window.URL.createObjectURL = vi.fn((blob: Blob) => {
      createdBlobs.push(blob);
      return 'blob:test';
    });
    window.URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(
      function (this: HTMLAnchorElement) {
        downloadedNames.push(this.download);
      }
    );

    await TestBed.configureTestingModule({
      imports: [ExportBookmarksDialogComponent],
      providers: [
        { provide: MatDialogRef, useValue: { close: vi.fn() } },
        { provide: MAT_DIALOG_DATA, useValue: { userId: 'u1' } },
        { provide: PersonalBookmarksService, useValue: bookmarksService },
        { provide: PersonalCollectionsService, useValue: collectionsService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ExportBookmarksDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => vi.restoreAllMocks());

  it('defaults to Codever JSON and explains both formats', () => {
    const text = fixture.nativeElement.textContent;

    expect(component.format).toBe('json');
    expect(text).toContain('Complete backup');
    expect(text).toContain('not the complete Codever data');
  });

  it('downloads the same JSON as before', async () => {
    await component.download();

    expect(createdBlobs).toHaveLength(1);
    expect(await createdBlobs[0].text()).toBe(
      JSON.stringify(bookmarks, null, 2)
    );
    expect(downloadedNames[0]).toMatch(/^bookmarks_.*\.json$/);
    expect(collectionsService.getAllUserCollections).not.toHaveBeenCalled();
  });

  it('downloads a browser HTML file with collections and tags', async () => {
    component.format = 'html';

    await component.download();

    const html = await createdBlobs[0].text();
    expect(createdBlobs[0].type).toBe('text/html');
    expect(downloadedNames[0]).toMatch(/^codever-bookmarks_.*\.html$/);
    expect(html).toContain('<!DOCTYPE NETSCAPE-Bookmark-file-1>');
    expect(html).toContain('>Reading list</H3>');
    expect(html).toContain('>java</H3>');
    expect(collectionsService.getAllUserCollections).toHaveBeenCalledWith(
      'u1'
    );
    expect(component.resultMessage).toBe('Exported 2 bookmarks.');
  });

  it('applies the tag folder cap and the all-tags option', async () => {
    component.format = 'html';
    component.tagFolderLimit = 1;
    await component.download();
    expect(await createdBlobs[0].text()).not.toContain('>spring</H3>');

    component.allTagFolders = true;
    await component.download();
    expect(await createdBlobs[1].text()).toContain('>spring</H3>');
  });

  it('reports bookmarks left out because of unsafe URLs', async () => {
    bookmarks.push(bookmark('3', [], 'javascript:alert(1)'));
    component.format = 'html';

    await component.download();

    expect(component.resultMessage).toContain('Exported 2 bookmarks.');
    expect(component.resultMessage).toContain('1 left out');
  });

  it('produces no file when there are no bookmarks', async () => {
    bookmarks = [];
    component.format = 'html';

    await component.download();

    expect(createdBlobs).toHaveLength(0);
    expect(component.resultMessage).toBe('You have no bookmarks to export.');
  });

  it('cannot export HTML with an invalid tag folder limit', async () => {
    component.format = 'html';
    component.tagFolderLimit = 0;

    expect(component.canExport).toBe(false);
    await component.download();
    expect(createdBlobs).toHaveLength(0);
  });

  it('shows an error when loading fails', async () => {
    bookmarksService.getAllMyBookmarks.mockReturnValue(
      throwError(() => new Error('boom'))
    );

    await component.download();

    expect(createdBlobs).toHaveLength(0);
    expect(component.errorMessage).toContain('problem preparing the export');
    expect(component.busy).toBe(false);
  });
});
