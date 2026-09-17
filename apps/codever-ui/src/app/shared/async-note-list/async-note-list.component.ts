import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
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
}
