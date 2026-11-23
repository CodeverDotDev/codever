import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Note } from '../../core/model/note';
import { SharedNote } from '../../core/model/share-link';
import { PublicNotesService } from '../../public/notes/public-notes.service';
import { SharedCopyHandoff } from '../../core/sharing/shared-copy-handoff.service';
import { NoteEditorComponent } from '../save-note-form/note-editor.component';

@Component({
  selector: 'app-copy-to-mine-note',
  templateUrl: './copy-to-mine-note.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [NoteEditorComponent, RouterLink],
})
export class CopyToMineNoteComponent implements OnInit {
  note: Note;
  loadFailed = false;

  constructor(
    private route: ActivatedRoute,
    private publicNotesService: PublicNotesService,
    private sharedCopyHandoff: SharedCopyHandoff
  ) {}

  /**
   * The note comes from the page that opened the copy (a public list or a
   * shared page). Without it only a public note can be loaded again.
   */
  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.note =
      window.history.state?.note ??
      (this.sharedCopyHandoff.take<SharedNote>('note', id) as Note);
    if (!this.note) {
      this.publicNotesService.getPublicNoteById(id).subscribe({
        next: (note) => (this.note = note),
        error: () => (this.loadFailed = true),
      });
    }
  }
}
