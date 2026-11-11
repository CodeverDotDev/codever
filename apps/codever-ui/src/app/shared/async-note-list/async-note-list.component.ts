import {
  ChangeDetectionStrategy,
  Component,
  Input,
  signal,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, of } from 'rxjs';
import { Note } from '../../core/model/note';
import { NoteDetailsComponent } from '../note-details/note-details.component';
import { PageNavigationBarComponent } from '../page-navigation-bar/page-navigation-bar.component';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-async-note-list',
  templateUrl: './async-note-list.component.html',
  styleUrls: ['./async-note-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NoteDetailsComponent, PageNavigationBarComponent, AsyncPipe],
})
export class AsyncNoteListComponent {
  readonly deletedNoteIds = signal(new Set<string>());

  @Input()
  notes$: Observable<Note[]>;

  @Input()
  queryText: string; // used for highlighting search terms in the bookmarks list

  @Input()
  callerPagination: string;

  @Input()
  showPagination = true;

  @Input()
  currentPage = 1;

  constructor(private route: ActivatedRoute) {}

  of(searchResult: Note) {
    return of(searchResult);
  }

  onNoteDeleted(note: Note): void {
    if (note._id) {
      this.deletedNoteIds.update((ids) => new Set(ids).add(note._id));
    }
  }

  visibleNotes(notes: Note[]): Note[] {
    const deletedIds = this.deletedNoteIds();
    return notes.filter((note) => !note._id || !deletedIds.has(note._id));
  }
}
