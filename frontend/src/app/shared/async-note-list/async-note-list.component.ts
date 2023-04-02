import { Component, Input, OnInit, } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, of } from 'rxjs';
import { Note } from '../../core/model/note';

@Component({
  selector: 'app-async-note-list',
  templateUrl: './async-note-list.component.html',
  styleUrls: ['./async-note-list.component.scss'],
})
export class AsyncNoteListComponent implements OnInit {
  @Input()
  notes$: Observable<Note[]>;

  @Input()
  queryText: string; // used for highlighting search terms in the bookmarks list

  @Input()
  callerPagination: string;

  @Input()
  showPagination = true;

  currentPage = 1;

  constructor(private route: ActivatedRoute) {
  }

  ngOnInit() {
  }

  of(searchResult: Note) {
    return of(searchResult);
  }
}
