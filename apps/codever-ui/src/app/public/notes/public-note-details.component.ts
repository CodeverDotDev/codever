import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Note } from '../../core/model/note';
import { PublicNotesService } from './public-notes.service';

@Component({
  selector: 'app-public-note-details',
  templateUrl: './public-note-details.component.html',
})
export class PublicNoteDetailsComponent implements OnInit {
  note$: Observable<Note>;

  constructor(
    private route: ActivatedRoute,
    private publicNotesService: PublicNotesService
  ) {}

  ngOnInit() {
    this.note$ = this.route.paramMap.pipe(
      switchMap((params) => {
        return this.publicNotesService.getPublicNoteById(params.get('id'));
      })
    );
  }
}

