
import { Component, Input } from '@angular/core';
import { Bookmark } from './bookmark';
@Component({
  selector: 'my-bookmark-detail',
  template: `
    <div *ngIf="bookmark">
      <h2>{{bookmark.name}} details!</h2>
      <div><label>id: </label>{{hero.id}}</div>
      <div>
        <label>name: </label>
        <input [(ngModel)]="bookmark.name" placeholder="name"/>
      </div>
    </div>
  `
})
export class BookmarkComponent {
  @Input()
  bookmark: Bookmark;
}