import { Component, OnInit } from '@angular/core';
import { Note } from '../../core/model/note';

@Component({
  selector: 'app-clone-note',
  templateUrl: './clone-note.component.html',
  styleUrls: ['./clone-note.component.scss'],
})
export class CloneNoteComponent implements OnInit {
  note: Note;

  ngOnInit(): void {
    this.note = window.history.state.note;
  }
}
