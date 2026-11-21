import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import iziToast from 'izitoast';

import { ImportBookmarksDialogComponent } from './import-bookmarks-dialog.component';
import { UserDataService } from '../../../core/user-data.service';
import { UserDataStore } from '../../../core/user/userdata.store';

const restoreResult = {
  created: [{ name: 'A', location: 'https://a.dev', tags: ['java'] }],
  duplicatesSize: 2,
  inErrorSize: 1,
  madePrivateSize: 1,
};

function fileInput(file?: File): HTMLInputElement {
  return { files: file ? [file] : [], value: 'x' } as unknown as HTMLInputElement;
}

function jsonFile(content: string): File {
  return new File([content], 'bookmarks.json', { type: 'application/json' });
}

describe('ImportBookmarksDialogComponent', () => {
  let fixture: ComponentFixture<ImportBookmarksDialogComponent>;
  let component: ImportBookmarksDialogComponent;
  let userDataService: {
    uploadBookmarks: ReturnType<typeof vi.fn>;
    restoreBookmarks: ReturnType<typeof vi.fn>;
  };
  let dialogRef: { close: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    userDataService = {
      uploadBookmarks: vi.fn(() =>
        of({ created: [], duplicatesSize: 0, inErrorSize: 0 })
      ),
      restoreBookmarks: vi.fn(() => of(restoreResult)),
    };
    dialogRef = { close: vi.fn() };
    vi.spyOn(iziToast, 'success').mockImplementation(() => undefined);
    vi.spyOn(iziToast, 'error').mockImplementation(() => undefined);

    await TestBed.configureTestingModule({
      imports: [ImportBookmarksDialogComponent],
      providers: [
        provideRouter([]),
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { userId: 'u1' } },
        { provide: UserDataService, useValue: userDataService },
        {
          provide: UserDataStore,
          useValue: {
            getUserData$: () => of({ profile: { displayName: 'Me' } }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ImportBookmarksDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => vi.restoreAllMocks());

  const fileInputElement = (): HTMLInputElement =>
    fixture.nativeElement.querySelector('#bookmarksFile');

  function selectFormat(format: 'html' | 'json') {
    component.format = format;
    component.onFormatChange();
    fixture.detectChanges();
  }

  it('defaults to Browser HTML with an HTML file picker', () => {
    expect(component.format).toBe('html');
    expect(fileInputElement().accept).toContain('text/html');
    expect(fixture.nativeElement.querySelector('#keepPublic')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('imported-browser');
  });

  it('switches the file picker, checkbox and notes for Codever JSON', () => {
    selectFormat('json');

    expect(fileInputElement().accept).toContain('.json');
    const keepPublic: HTMLInputElement =
      fixture.nativeElement.querySelector('#keepPublic');
    expect(keepPublic).not.toBeNull();
    expect(keepPublic.checked).toBe(false);
    expect(component.keepPublic).toBe(false);
    const notes = fixture.nativeElement.querySelector(
      '.import-notes-json'
    ).textContent;
    expect(notes).toContain('yours is kept');
    expect(notes).toContain('dates are restored');
    expect(component.uploadImageLabel).toBe('Choose Codever JSON export file');
  });

  it('still uploads HTML files with the browser import', async () => {
    const file = new File(['<html></html>'], 'b.html', { type: 'text/html' });

    component.importFile(fileInput(file));
    await vi.waitFor(() =>
      expect(userDataService.uploadBookmarks).toHaveBeenCalledWith(
        'u1',
        file,
        'Me'
      )
    );
    expect(userDataService.restoreBookmarks).not.toHaveBeenCalled();
  });

  it('restores a Codever JSON export and reports the counts', async () => {
    selectFormat('json');
    component.keepPublic = true;
    const bookmarks = [{ name: 'A', location: 'https://a.dev' }];

    await component.restoreCodeverJson(jsonFile(JSON.stringify(bookmarks)));

    expect(userDataService.restoreBookmarks).toHaveBeenCalledWith(
      'u1',
      bookmarks,
      true,
      'Me'
    );
    expect(userDataService.uploadBookmarks).not.toHaveBeenCalled();
    const message = vi.mocked(iziToast.success).mock.calls[0][0].message;
    expect(message).toContain('1 newly created');
    expect(message).toContain('2 already existing');
    expect(message).toContain('1 not valid');
    expect(message).toContain('1 made private');
    expect(dialogRef.close).toHaveBeenCalledWith(restoreResult);
  });

  it('routes JSON files chosen in the picker to the restore', async () => {
    selectFormat('json');

    component.importFile(fileInput(jsonFile('[]')));

    await vi.waitFor(() =>
      expect(userDataService.restoreBookmarks).toHaveBeenCalledWith(
        'u1',
        [],
        false,
        'Me'
      )
    );
  });

  it.each([
    ['not valid JSON', '<html>', 'not valid JSON'],
    ['not a list', '{"name":"x"}', 'does not contain a list'],
  ])(
    'shows an error and uploads nothing for a file that is %s',
    async (_, content, expected) => {
      selectFormat('json');

      await component.restoreCodeverJson(jsonFile(content));
      fixture.detectChanges();

      expect(userDataService.restoreBookmarks).not.toHaveBeenCalled();
      expect(
        fixture.nativeElement.querySelector('.import-error').textContent
      ).toContain(expected);
      expect(dialogRef.close).not.toHaveBeenCalled();
    }
  );

  it('explains the size limit when the API rejects a too large file', async () => {
    userDataService.restoreBookmarks.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 413 }))
    );
    selectFormat('json');

    await component.restoreCodeverJson(jsonFile('[]'));

    expect(component.errorMessage).toContain('larger than 6 MB');
    expect(component.busy).toBe(false);
    expect(dialogRef.close).not.toHaveBeenCalled();
  });

  it('ignores a file picker change without a file', () => {
    component.importFile(fileInput());

    expect(userDataService.uploadBookmarks).not.toHaveBeenCalled();
    expect(userDataService.restoreBookmarks).not.toHaveBeenCalled();
  });
});
