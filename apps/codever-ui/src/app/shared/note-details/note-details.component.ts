import { Component, Input, OnInit } from '@angular/core';
import { Note } from '../../core/model/note';
import { Observable, of } from 'rxjs';
import { UserInfoStore } from '../../core/user/user-info.store';
import { ActivatedRoute, Router } from '@angular/router';
import { switchMap } from 'rxjs/operators';
import { PersonalNotesService } from '../../core/personal-notes.service';

@Component({
  selector: 'app-note-details',
  templateUrl: './note-details.component.html',
})
export class NoteDetailsComponent implements OnInit {
  @Input()
  note$: Observable<Note>;

  @Input()
  queryText: string;

  @Input()
  inSearchResults = false;

  userId$: Observable<string>;
  noteId: string;

  constructor(
    private personalNotesService: PersonalNotesService,
    private userInfoStore: UserInfoStore,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.userId$ = this.userInfoStore.getUserId$();
    if (!this.inSearchResults) {
      if (window.history.state.note) {
        this.note$ = of(window.history.state.snippet);
      } else {
        this.note$ = this.userId$.pipe(
          switchMap((userId) => {
            this.noteId = this.route.snapshot.paramMap.get('id');
            return this.personalNotesService.getPersonalNoteById(
              userId,
              this.noteId
            );
          })
        );
      }
    }
  }

  editNote(note: Note) {
    const link = [`/my-notes/${note._id}/edit`];
    this.router.navigate(link, { state: { note: note } });
  }

  cloneNote(note: Note) {
    const link = [`/my-notes/${note._id}/clone`];
    this.router.navigate(link, { state: { note: note } });
  }
}
