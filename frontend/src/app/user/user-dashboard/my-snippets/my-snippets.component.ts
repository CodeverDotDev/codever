import { Component, Input, OnChanges } from '@angular/core';
import { Observable } from 'rxjs';
import { Snippet } from '../../../core/model/snippet';
import { PersonalSnippetsService } from '../../../core/personal-snippets.service';

@Component({
  selector: 'app-my-snippets',
  templateUrl: './my-snippets.component.html'
})
export class MySnippetsComponent implements OnChanges {

  mySnippets$: Observable<Snippet[]>;

  @Input()
  userId: string;

  constructor(private personalSnippetsService: PersonalSnippetsService) {
  }

  ngOnChanges() {
    if (this.userId) { // TODO - maybe consider doing different to pass the userId to child component
      this.mySnippets$ = this.personalSnippetsService.getLatestSnippets(this.userId);
    }
  }

}
