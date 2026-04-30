import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Note } from '../../core/model/note';
import { PublicNotesService } from '../../public/notes/public-notes.service';

@Component({
  selector: 'app-copy-to-mine-note',
  templateUrl: './copy-to-mine-note.component.html',
})
export class CopyToMineNoteComponent implements OnInit {
  note: Note;

  constructor(
    private route: ActivatedRoute,
    private publicNotesService: PublicNotesService
  ) {}

  ngOnInit(): void {
    this.note = window.history.state.note;
    if (!this.note) {
      const id = this.route.snapshot.paramMap.get('id');
      this.publicNotesService
        .getPublicNoteById(id)
        .subscribe((note) => (this.note = note));
    }
  }
}

