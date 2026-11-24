import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { EMPTY, Observable } from 'rxjs';
import { catchError, filter, switchMap } from 'rxjs/operators';
import iziToast from 'izitoast';
import { Bookmark } from '../../core/model/bookmark';
import { Note } from '../../core/model/note';
import { PersonalBookmarksService } from '../../core/personal-bookmarks.service';
import { PersonalNotesService } from '../../core/personal-notes.service';
import { UserDataStore } from '../../core/user/userdata.store';
import { UndoLastSaveDialogComponent } from './undo-last-save-dialog.component';
import { toUndoUpdate, UndoLastSaveEntryType } from './undo-last-save';

/**
 * "Undo last save" on the details page an editor opened after a save. It
 * writes the entry from before the save back through the normal update, after
 * confirmation, and then disappears; there is no redo.
 */
@Component({
  selector: 'app-undo-last-save',
  templateUrl: './undo-last-save.component.html',
  styleUrls: ['./undo-last-save.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class UndoLastSaveComponent<T extends Bookmark | Note> {
  @Input({ required: true }) entryType!: UndoLastSaveEntryType;
  /** The entry as it was before the save. */
  @Input({ required: true }) before!: T;

  /** Emits the entry after the save was undone. */
  @Output() undone = new EventEmitter<T>();

  undoing = false;

  constructor(
    private dialog: MatDialog,
    private personalBookmarksService: PersonalBookmarksService,
    private personalNotesService: PersonalNotesService,
    private userDataStore: UserDataStore,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  get entryTitle(): string | undefined {
    return (this.before as Bookmark).name ?? (this.before as Note).title;
  }

  undo(): void {
    this.dialog
      .open(UndoLastSaveDialogComponent, {
        width: '420px',
        data: { entryTitle: this.entryTitle },
      })
      .afterClosed()
      .pipe(
        filter((result) => result === 'CONFIRM'),
        switchMap(() => {
          this.undoing = true;
          return this.update(toUndoUpdate(this.entryType, this.before));
        }),
        catchError((error) => {
          this.undoing = false;
          this.changeDetectorRef.markForCheck();
          iziToast.error({
            title: 'Could not undo the last save',
            message:
              error?.status === 409
                ? 'Another user already has a public bookmark with this URL.'
                : 'Please try again.',
          });
          return EMPTY;
        })
      )
      .subscribe((restored) => {
        this.userDataStore.updateUserDataHistory$(restored).subscribe();
        this.undone.emit(restored);
      });
  }

  private update(entry: T): Observable<T> {
    return this.entryType === 'bookmark'
      ? this.personalBookmarksService.updateBookmark(entry as Bookmark)
      : this.personalNotesService.updateNote(entry as Note);
  }
}
