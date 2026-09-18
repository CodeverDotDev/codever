import { Component, OnInit } from '@angular/core';
import { Bookmark } from '../../core/model/bookmark';
import { Observable, of } from 'rxjs';
import { SaveBookmarkFormComponent } from '../save-bookmark-form/save-bookmark-form.component';

@Component({
  selector: 'app-clone-bookmark',
  templateUrl: './clone-bookmark.component.html',
  styleUrls: ['./clone-bookmark.component.scss'],
  imports: [SaveBookmarkFormComponent],
})
export class CloneBookmarkComponent implements OnInit {
  bookmark$: Observable<Bookmark>;

  constructor() {}

  ngOnInit(): void {
    this.bookmark$ = of(window.history.state.bookmark);
  }
}
