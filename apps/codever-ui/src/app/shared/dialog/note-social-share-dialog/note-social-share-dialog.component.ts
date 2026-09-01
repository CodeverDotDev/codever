import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Note } from '../../../core/model/note';
import { PersonalNotesService } from '../../../core/personal-notes.service';

@Component({
    selector: 'app-note-social-share-dialog',
    templateUrl: './note-social-share-dialog.component.html',
    styleUrls: ['./note-social-share-dialog.component.scss'],
    standalone: false
})
export class NoteSocialShareDialogComponent {
  shareableId$: Observable<any>;
  public note: Note;
  readonly environment = environment;

  constructor(
    private dialogRef: MatDialogRef<NoteSocialShareDialogComponent>,
    private personalNotesService: PersonalNotesService,
    @Inject(MAT_DIALOG_DATA) data
  ) {
    this.note = data.note;
    if (!this.note.public) {
      this.shareableId$ = this.personalNotesService.createOrGetShareableId(
        data.userId,
        this.note._id
      );
    }
  }

  close() {
    this.dialogRef.close('SHARE_CANCELED');
  }
}

