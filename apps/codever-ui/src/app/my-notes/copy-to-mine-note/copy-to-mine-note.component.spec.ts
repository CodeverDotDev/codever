import { afterEach, describe, expect, it, vi } from 'vitest';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';

import { CopyToMineNoteComponent } from './copy-to-mine-note.component';
import { PublicNotesService } from '../../public/notes/public-notes.service';
import { SharedCopyHandoff } from '../../core/sharing/shared-copy-handoff.service';

const publicNote = { _id: 'n1', title: 'Public note', public: true };
const sharedNote = { _id: 'n1', type: 'note', title: 'Shared note' };

const render = (getPublicNoteById: ReturnType<typeof vi.fn>) => {
  TestBed.configureTestingModule({
    imports: [CopyToMineNoteComponent],
    providers: [
      provideRouter([]),
      {
        provide: ActivatedRoute,
        useValue: { snapshot: { paramMap: { get: () => 'n1' } } },
      },
      { provide: PublicNotesService, useValue: { getPublicNoteById } },
    ],
  });
  TestBed.overrideComponent(CopyToMineNoteComponent, {
    set: { imports: [RouterLink], schemas: [NO_ERRORS_SCHEMA] },
  });
  return TestBed.inject(SharedCopyHandoff);
};

const create = () => {
  const fixture = TestBed.createComponent(CopyToMineNoteComponent);
  fixture.detectChanges();
  return fixture;
};

describe('CopyToMineNoteComponent', () => {
  afterEach(() => history.replaceState(null, ''));

  it('uses the note passed by an in-app list', () => {
    const getPublicNoteById = vi.fn();
    render(getPublicNoteById);
    history.replaceState({ note: publicNote }, '');

    const fixture = create();

    expect(fixture.componentInstance.note).toEqual(publicNote);
    expect(getPublicNoteById).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('app-note-editor')).not.toBeNull();
  });

  it('uses the note handed over by a shared page', () => {
    const getPublicNoteById = vi.fn();
    const handoff = render(getPublicNoteById);
    handoff.put('note', sharedNote);

    const fixture = create();

    expect(fixture.componentInstance.note).toBe(sharedNote);
    expect(getPublicNoteById).not.toHaveBeenCalled();
  });

  it('loads a public note by id when nothing was handed over', () => {
    const getPublicNoteById = vi.fn().mockReturnValue(of(publicNote));
    render(getPublicNoteById);

    const fixture = create();

    expect(getPublicNoteById).toHaveBeenCalledWith('n1');
    expect(fixture.componentInstance.note).toEqual(publicNote);
  });

  it('explains instead of showing an empty form when loading fails', () => {
    const getPublicNoteById = vi
      .fn()
      .mockReturnValue(
        throwError(() => new HttpErrorResponse({ status: 404 }))
      );
    render(getPublicNoteById);

    const fixture = create();

    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('app-note-editor')).toBeNull();
    expect(element.querySelector('.copy-unavailable')?.textContent).toContain(
      'open the sharing link again'
    );
  });
});
