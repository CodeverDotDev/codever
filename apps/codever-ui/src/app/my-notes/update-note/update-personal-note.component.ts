import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UserInfoStore } from '../../core/user/user-info.store';
import { PersonalNotesService } from '../../core/personal-notes.service';
import { Note } from '../../core/model/note';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
    selector: 'app-personal-note-update',
    templateUrl: './update-personal-note.component.html',
    standalone: false
})
export class UpdatePersonalNoteComponent implements OnInit {
  note$: Observable<Note>;
  noteId: string;
  userId: string;

  constructor(
    private route: ActivatedRoute,
    private personalNotesService: PersonalNotesService,
    private userInfoStore: UserInfoStore
  ) {}

  ngOnInit(): void {
    // Always load the latest version from the API before editing. Relying on a
    // note passed via router state (e.g. from the pinned / quick-access panel,
    // history or search) could load a stale copy and, on save, overwrite newer
    // changes made elsewhere (a lost update).
    this.note$ = this.userInfoStore.getUserInfoOidc$().pipe(
      switchMap((userInfo) => {
        this.userId = userInfo.sub;
        this.noteId = this.route.snapshot.paramMap.get('id');
        return this.personalNotesService.getPersonalNoteById(
          this.userId,
          this.noteId
        );
      })
    );
  }
}
