import { Component, Input, OnChanges } from '@angular/core';
import { Observable } from 'rxjs';
import { Codelet } from '../../../core/model/codelet';
import { PersonalCodeletsService } from '../../../core/personal-codelets.service';

@Component({
  selector: 'app-my-snippets',
  templateUrl: './my-snippets.component.html'
})
export class MySnippetsComponent implements OnChanges {

  mySnippets$: Observable<Codelet[]>;

  @Input()
  userId: string;

  constructor(private personalSnippetsService: PersonalCodeletsService) {
  }

  ngOnChanges() {
    if (this.userId) { // TODO - maybe consider doing different to pass the userId to child component
      this.mySnippets$ = this.personalSnippetsService.getLatestSnippets(this.userId);
    }
  }

}
