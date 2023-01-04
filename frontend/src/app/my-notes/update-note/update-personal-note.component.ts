import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UserInfoStore } from '../../core/user/user-info.store';
import { PersonalNotesService } from '../../core/personal-notes.service';
import { Note } from '../../core/model/note';
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-personal-note-update',
  templateUrl: './update-personal-note.component.html'
})
export class UpdatePersonalNoteComponent implements OnInit {

  note$: Observable<Note>;
  noteId: string;
  userId: string;

  constructor(private route: ActivatedRoute,
              private personalNotesService: PersonalNotesService,
              private userInfoStore: UserInfoStore) {

  }

  ngOnInit(): void {
    if (window.history.state.note) {
      this.note$ = of(window.history.state.note)
    } else {
     this.note$ = this.userInfoStore.getUserInfoOidc$().pipe(switchMap(userInfo => {
        this.userId = userInfo.sub;
        this.noteId = this.route.snapshot.paramMap.get('id');
        return this.personalNotesService.getPersonalNoteById(this.userId, this.noteId);
      }));
    }
  }
}


