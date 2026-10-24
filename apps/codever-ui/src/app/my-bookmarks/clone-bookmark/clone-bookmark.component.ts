import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Bookmark } from '../../core/model/bookmark';
import { Observable, of } from 'rxjs';
import { SaveBookmarkFormComponent } from '../save-bookmark-form/save-bookmark-form.component';

@Component({
  selector: 'app-clone-bookmark',
  templateUrl: './clone-bookmark.component.html',
  styleUrls: ['./clone-bookmark.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [SaveBookmarkFormComponent],
})
export class CloneBookmarkComponent implements OnInit {
  bookmark$: Observable<Bookmark>;

  ngOnInit(): void {
    this.bookmark$ = of(window.history.state.bookmark);
  }
}
