import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Note } from '../../../core/model/note';
import { PublicNotesService } from '../public-notes.service';

@Component({
    selector: 'app-shareable-note-details',
    templateUrl: './shareable-note-details.component.html',
    styleUrls: ['./shareable-note-details.component.scss'],
    standalone: false
})
export class ShareableNoteDetailsComponent implements OnInit {
  note$: Observable<Note>;

  constructor(
    private route: ActivatedRoute,
    private publicNotesService: PublicNotesService
  ) {}

  ngOnInit() {
    this.note$ = this.route.paramMap.pipe(
      switchMap((params) => {
        return this.publicNotesService.getSharedNoteBySharableId(
          params.get('shareableId')
        );
      })
    );
  }
}

